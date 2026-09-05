'use client'

import { useEffect, useState } from 'react'
import type { Txn } from '@/lib/recon-data'
import { formatINR } from '@/lib/recon-data'
import { cn } from '@/lib/utils'
import { SeverityBadge } from './badges'
import { Check, Copy, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function buildPayload(t: Txn) {
  return {
    event: 'merchant.dispute.create',
    idempotency_key: `disp_${t.id.slice(4, 18)}`,
    transaction_id: t.id,
    order_id: t.orderId,
    diagnosis: t.categoryLabel,
    severity: t.severity,
    ledger_diff: {
      instrument: t.instrument,
      mdr_tier_expected: `${(t.expected.mdrRate * 100).toFixed(0)}%`,
      gross_amount_paise: Math.round(t.expected.gross * 100),
      expected_fee_paise: Math.round(t.expected.fee * 100),
      expected_gst_paise: Math.round(t.expected.gst * 100),
      expected_net_paise: Math.round(t.expected.net * 100),
      actual_fee_paise: Math.round(t.actual.fee * 100),
      actual_gst_paise: Math.round(t.actual.gst * 100),
      actual_net_paise: Math.round(t.actual.net * 100),
      variance_paise: Math.round(t.variance * 100),
    },
    evidence_trail: [
      `internal_ledger:${t.orderId}`,
      `payout_leg:${t.id}`,
      `bank_status:${t.bankStatus}`,
    ],
    recommended_credit_action: t.action,
  }
}

function Row({
  label,
  expected,
  actual,
  highlight,
}: {
  label: string
  expected: string
  actual: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1.2fr_1fr_1fr] items-center gap-2 border-b border-slate-100 py-2 last:border-0',
        highlight && 'bg-rose-50/50',
      )}
    >
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-right font-mono text-[11px] tabular text-slate-700">
        {expected}
      </span>
      <span
        className={cn(
          'text-right font-mono text-[11px] tabular font-medium',
          highlight ? 'text-rose-600' : 'text-slate-700',
        )}
      >
        {actual}
      </span>
    </div>
  )
}

type DispatchState = 'idle' | 'loading' | 'confirmed'

export function DisputeDrawer({
  txn,
  onClose,
  onDispatched,
}: {
  txn: Txn | null
  onClose: () => void
  onDispatched?: (txnId: string, varianceAmount: number) => void
}) {
  const [copied, setCopied] = useState(false)
  const [dispatchState, setDispatchState] = useState<DispatchState>('idle')

  useEffect(() => {
    setCopied(false)
    setDispatchState('idle')
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (txn) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [txn, onClose])

  const payload = txn ? buildPayload(txn) : null
  const payloadStr = payload ? JSON.stringify(payload, null, 2) : ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(payloadStr)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function dispatchDispute() {
    if (!txn || dispatchState !== 'idle') return
    setDispatchState('loading')
    setTimeout(() => {
      setDispatchState('confirmed')
      onDispatched?.(txn.id, Math.abs(txn.variance))
    }, 600)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity',
          txn ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Dispute & Audit Inspector"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-200/60 transition-transform duration-300 ease-out',
          txn ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {txn && (
          <>
            {/* Drawer header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-semibold text-slate-800">
                    Dispute &amp; Audit Inspector
                  </span>
                  <SeverityBadge severity={txn.severity!} />
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-400">
                  {txn.id} · {txn.categoryLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
                aria-label="Close inspector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Root cause */}
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Root Cause Diagnosis
                </h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[12px] leading-relaxed text-slate-700">
                    {txn.rootCause}
                  </p>
                </div>
              </section>

              {/* Ledger diff */}
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Ledger Diff · Internal vs Razorpay Payout
                </h3>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-medium text-slate-400">
                      Field
                    </span>
                    <span className="text-right text-[10px] font-medium text-blue-600">
                      Internal ledger
                    </span>
                    <span className="text-right text-[10px] font-medium text-amber-600">
                      Razorpay payout
                    </span>
                  </div>
                  <Row
                    label="Gross Amount"
                    expected={formatINR(txn.expected.gross)}
                    actual={formatINR(txn.actual.gross)}
                  />
                  <Row
                    label={`MDR Fee (${(txn.expected.mdrRate * 100).toFixed(0)}% exp)`}
                    expected={formatINR(txn.expected.fee)}
                    actual={formatINR(txn.actual.fee)}
                    highlight={txn.expected.fee !== txn.actual.fee}
                  />
                  <Row
                    label="GST @ 18%"
                    expected={formatINR(txn.expected.gst)}
                    actual={formatINR(txn.actual.gst)}
                    highlight={txn.expected.gst !== txn.actual.gst}
                  />
                  <Row
                    label="Net Settlement"
                    expected={formatINR(txn.expected.net)}
                    actual={formatINR(txn.actual.net)}
                    highlight={
                      Math.abs(txn.expected.net - txn.actual.net) > 0.05
                    }
                  />
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                  <span className="text-[11px] font-medium text-rose-700">
                    Computed Variance (Δ)
                  </span>
                  <span className="font-mono text-[14px] font-semibold tabular text-rose-700">
                    {txn.variance < 0 ? '−' : '+'}
                    {formatINR(Math.abs(txn.variance))}
                  </span>
                </div>
              </section>

              {/* Recommended action */}
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Recommended Action
                </h3>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-[12px] font-medium text-blue-700">
                  {txn.action}
                </div>
              </section>

              {/* Dispatch confirmation card */}
              {dispatchState === 'confirmed' && (
                <section>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-[12px] font-semibold text-emerald-800">
                        Dispute API confirmation received
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-md bg-white border border-emerald-200 px-3 py-2">
                        <span className="text-[11px] text-slate-500">Generated Dispute ID</span>
                        <span className="font-mono text-[11px] font-semibold text-slate-800">
                          disp_live_908214a
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-white border border-emerald-200 px-3 py-2">
                        <span className="text-[11px] text-slate-500">Gateway Status</span>
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700">
                          ACTION_REQUIRED_FROM_GATEWAY
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-white border border-emerald-200 px-3 py-2">
                        <span className="text-[11px] text-slate-500">SLA Window</span>
                        <span className="text-[11px] font-medium text-slate-700">
                          48-Hour Banker Settlement Window
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* JSON payload */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Razorpay Dispute API Payload
                  </h3>
                  <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                  {payloadStr}
                </pre>
              </section>
            </div>

            {/* Footer actions */}
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 space-y-2">
              {dispatchState === 'idle' && (
                <button
                  type="button"
                  id="dispatch-dispute-btn"
                  onClick={dispatchDispute}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 animate-gradient px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <AlertCircle className="h-4 w-4" />
                  {txn.actionLabel} · Dispatch Dispute Payload
                </button>
              )}
              {dispatchState === 'loading' && (
                <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[13px] font-medium text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Dispatching POST /v1/disputes/create…
                </div>
              )}
              {dispatchState === 'confirmed' && (
                <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Dispute dispatched · disp_live_908214a
                </div>
              )}
              <button
                type="button"
                onClick={copy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-slate-300"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                Copy JSON payload
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
