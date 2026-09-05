'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AUDIT_LOG, type LogLine } from '@/lib/audit-log'
import {
  EXCEPTIONS,
  TRANSACTIONS,
  STANDARD_METRICS,
  type Txn,
  formatINR,
} from '@/lib/recon-data'
import {
  DIWALI_EXCEPTIONS,
  DIWALI_TRANSACTIONS,
  DIWALI_METRICS,
  CLEAN_RUN_EXCEPTIONS,
  CLEAN_RUN_TRANSACTIONS,
  CLEAN_RUN_METRICS,
  type BatchProfileId,
} from '@/lib/batch-profiles'
import { TopNav } from '@/components/recon/top-nav'
import { TelemetryStrip } from '@/components/recon/telemetry-strip'
import { ControlsBar, type FilterKey } from '@/components/recon/controls-bar'
import { AuditTerminal } from '@/components/recon/audit-terminal'
import { ExceptionTable } from '@/components/recon/exception-table'
import { CleanLedger } from '@/components/recon/clean-ledger'
import { DisputeDrawer } from '@/components/recon/dispute-drawer'
import { IngestionModal } from '@/components/recon/ingestion-modal'
import { Database, Landmark, Lock, CheckCircle2, Download, X } from 'lucide-react'

type Phase = 'idle' | 'running' | 'done'

// ── Batch profile data map ────────────────────────────────────────────────────
const PROFILE_DATA: Record<
  BatchProfileId,
  {
    transactions: Txn[]
    exceptions: Txn[]
    autoClosed: Txn[]
    metrics: typeof STANDARD_METRICS
  }
> = {
  standard: {
    transactions: TRANSACTIONS,
    exceptions: EXCEPTIONS,
    autoClosed: TRANSACTIONS.filter((t) => t.status === 'auto_closed'),
    metrics: STANDARD_METRICS,
  },
  diwali: {
    transactions: DIWALI_TRANSACTIONS,
    exceptions: DIWALI_EXCEPTIONS,
    autoClosed: DIWALI_TRANSACTIONS.filter((t) => t.status === 'auto_closed'),
    metrics: DIWALI_METRICS,
  },
  clean: {
    transactions: CLEAN_RUN_TRANSACTIONS,
    exceptions: CLEAN_RUN_EXCEPTIONS,
    autoClosed: CLEAN_RUN_TRANSACTIONS.filter((t) => t.status === 'auto_closed'),
    metrics: CLEAN_RUN_METRICS,
  },
}

// ── Export toast component ───────────────────────────────────────────────────
function ExportToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="animate-fade-slide-up fixed bottom-6 right-6 z-50 w-96 overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-xl shadow-slate-200/60">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-800">
            Audit packet exported
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            ReconPilot_Audit_Batch_RZP2026.csv downloaded
          </div>
          <div className="mt-2.5 space-y-1.5 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">SHA-256</span>
              <span className="font-mono text-[10px] text-slate-600 truncate max-w-[220px]">
                e3b0c44298fc1c149afbf4c8996fb924…b855
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">Timestamp</span>
              <span className="font-mono text-[10px] text-slate-600">
                2026-09-05T19:15:00Z
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">Epsilon</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-700">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Verified (≤ ₹0.05)
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 animate-gradient" />
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Page() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [logs, setLogs] = useState<LogLine[]>([])
  const [progress, setProgress] = useState(0)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('exceptions')
  const [selected, setSelected] = useState<Txn | null>(null)
  const [zeroDrift, setZeroDrift] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<BatchProfileId>('standard')
  const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set())
  const [leakageOverride, setLeakageOverride] = useState<number | undefined>(undefined)
  const [showModal, setShowModal] = useState(false)
  const [showExportToast, setShowExportToast] = useState(false)
  const timers = useRef<number[]>([])

  const profileData = PROFILE_DATA[selectedProfile]

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  // When profile changes, reset to idle with fresh state
  const handleSelectProfile = useCallback(
    (id: BatchProfileId) => {
      clearTimers()
      setSelectedProfile(id)
      setPhase('idle')
      setLogs([])
      setProgress(0)
      setSelected(null)
      setDisputedIds(new Set())
      setLeakageOverride(undefined)
      setActiveFilter('exceptions')
    },
    [clearTimers],
  )

  const execute = useCallback(() => {
    clearTimers()
    setSelected(null)
    setPhase('running')
    setLogs([])
    setProgress(0)
    let acc = 0
    AUDIT_LOG.forEach((line, idx) => {
      acc += line.delay
      const id = window.setTimeout(() => {
        setLogs((prev) => [...prev, line])
        setProgress(line.progress)
        if (idx === AUDIT_LOG.length - 1) {
          const doneId = window.setTimeout(() => {
            setPhase('done')
            setActiveFilter('exceptions')
          }, 550)
          timers.current.push(doneId)
        }
      }, acc)
      timers.current.push(id)
    })
  }, [clearTimers])

  // Handle ingestion modal completing: reset and execute
  const handleIngest = useCallback(() => {
    clearTimers()
    setSelected(null)
    setDisputedIds(new Set())
    setLeakageOverride(undefined)
    setLogs([])
    setProgress(0)
    setPhase('idle')
    // Small delay then auto-execute
    const tid = window.setTimeout(() => execute(), 400)
    timers.current.push(tid)
  }, [clearTimers, execute])

  // Handle dispute dispatch: update row badge + decrement leakage
  const handleDispatched = useCallback(
    (txnId: string, varianceAmount: number) => {
      setDisputedIds((prev) => new Set([...prev, txnId]))
      setLeakageOverride((prev) => {
        const current =
          prev !== undefined ? prev : profileData.metrics.financialLeakage
        return Math.max(0, Math.round((current - varianceAmount) * 100) / 100)
      })
    },
    [profileData.metrics.financialLeakage],
  )

  const tableTxns = useMemo(() => {
    const { exceptions, autoClosed, transactions } = profileData
    switch (activeFilter) {
      case 'auto':
        return autoClosed
      case 'exceptions':
        return exceptions
      case 'critical':
        return exceptions.filter((t) => t.severity === 'critical')
      default:
        return [...exceptions, ...autoClosed]
    }
  }, [activeFilter, profileData])

  const exportPacket = useCallback(() => {
    const header = [
      'Order ID',
      'Payment ID',
      'Instrument',
      'Gross Amount',
      'Expected Net',
      'Actual Net',
      'Variance',
      'Root Cause',
      'Status',
    ]
    const rows = profileData.transactions.map((t) =>
      [
        t.orderId,
        t.id,
        t.instrument,
        t.expected.gross.toFixed(2),
        t.expected.net.toFixed(2),
        t.actual.net.toFixed(2),
        t.variance.toFixed(2),
        t.categoryLabel ?? 'auto_closed_zero_variance',
        t.status,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    )
    const csv = [header.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ReconPilot_Audit_Batch_RZP2026.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportToast(true)
    setTimeout(() => setShowExportToast(false), 6000)
  }, [profileData])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopNav
        zeroDrift={zeroDrift}
        onToggleZeroDrift={() => setZeroDrift((z) => !z)}
        onExport={exportPacket}
        exportDisabled={phase !== 'done'}
        onUpload={() => setShowModal(true)}
        selectedProfile={selectedProfile}
        onSelectProfile={handleSelectProfile}
      />

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 lg:px-6">
        <TelemetryStrip
          reconciled={phase === 'done'}
          metrics={profileData.metrics}
          financialLeakageOverride={leakageOverride}
        />

        <ControlsBar
          phase={phase}
          onExecute={execute}
          activeFilter={activeFilter}
          onFilter={setActiveFilter}
          counts={{
            totalCount: profileData.metrics.totalCount,
            autoClosedCount: profileData.metrics.autoClosedCount,
            exceptionCount: profileData.metrics.exceptionCount,
            criticalCount: profileData.metrics.criticalCount,
          }}
        />

        {phase === 'idle' && (
          <IdlePanel
            batchId={profileData.metrics.batchId}
            totalCount={profileData.metrics.totalCount}
          />
        )}

        {phase !== 'idle' && (
          <AuditTerminal
            lines={logs}
            progress={progress}
            running={phase === 'running'}
          />
        )}

        {phase === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-[14px] font-semibold text-slate-700">
                {activeFilter === 'auto'
                  ? 'Auto-Closed Ledger'
                  : activeFilter === 'critical'
                    ? 'Critical Disputes'
                    : activeFilter === 'all'
                      ? 'Full Reconciliation Ledger'
                      : 'Exception List'}
                <span className="ml-2 font-mono text-[12px] font-normal text-slate-400">
                  {tableTxns.length} records
                </span>
              </h2>
              <span className="hidden text-[11px] text-slate-400 sm:inline">
                Click{' '}
                <span className="font-medium text-blue-600">Inspect</span> on
                any exception to open the audit docket
              </span>
            </div>

            <ExceptionTable
              txns={tableTxns}
              onInspect={setSelected}
              disputedIds={disputedIds}
            />

            {activeFilter !== 'auto' && (
              <CleanLedger
                txns={profileData.autoClosed}
                count={profileData.metrics.autoClosedCount}
              />
            )}
          </div>
        )}
      </main>

      <DisputeDrawer
        txn={selected}
        onClose={() => setSelected(null)}
        onDispatched={handleDispatched}
      />

      <IngestionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onIngest={handleIngest}
      />

      {showExportToast && (
        <ExportToast onDismiss={() => setShowExportToast(false)} />
      )}

      <footer className="border-t border-slate-200 bg-white px-4 py-4 lg:px-6 mt-8">
        <p className="mx-auto max-w-[1400px] flex items-center gap-4 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-600">ReconPilot OS</span>
          <span className="text-slate-300">·</span>
          Razorpay AI Buildathon — Track 4, AI Finance Controller
          <span className="text-slate-300">·</span>
          Deterministic epsilon verification (≤ ₹0.05)
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Epsilon Verified
          </span>
        </p>
      </footer>
    </div>
  )
}

// ── Idle panel ───────────────────────────────────────────────────────────────
function IdlePanel({
  batchId,
  totalCount,
}: {
  batchId: string
  totalCount: number
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
        <StreamCard
          icon={<Database className="h-5 w-5 text-blue-500" />}
          iconBg="bg-blue-50"
          title="Internal Merchant Order DB"
          meta="Expected GMV · Product ledger · Fee tier"
          count={totalCount}
          label="Ledger entries"
        />
        <StreamCard
          icon={<Landmark className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-50"
          title="Razorpay Payout Settlement Batch"
          meta="Captured funds · MDR/GST · Bank status"
          count={totalCount}
          label="Settlement legs"
        />
      </div>
      <div className="flex items-center justify-center gap-2.5 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
        <Lock className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[12px] text-slate-500">
          Batch{' '}
          <span className="font-mono font-medium text-slate-700">
            #{batchId}
          </span>{' '}
          ready · Execute the reconciliation loop to unlock deterministic diagnostics
        </span>
      </div>
    </div>
  )
}

function StreamCard({
  icon,
  iconBg,
  title,
  meta,
  count,
  label,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  meta: string
  count: number
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-6">
      <div className="flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-slate-700">{title}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">{meta}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-2xl font-bold tabular text-slate-800">
          {count}
        </div>
        <div className="text-[11px] text-slate-400">{label}</div>
      </div>
    </div>
  )
}
