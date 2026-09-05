'use client'

import { formatINR } from '@/lib/recon-data'
import { cn } from '@/lib/utils'
import { ShieldCheck, TrendingDown, GitCompareArrows, Wallet } from 'lucide-react'

interface BatchMetrics {
  totalCount: number
  autoClosedCount: number
  exceptionCount: number
  matchRate: number
  grossVolume: number
  financialLeakage: number
}

function Kpi({
  label,
  value,
  sub,
  accent,
  icon,
  locked,
  children,
}: {
  label: string
  value: React.ReactNode
  sub: React.ReactNode
  accent: 'blue' | 'green' | 'red' | 'neutral'
  icon: React.ReactNode
  locked: boolean
  children?: React.ReactNode
}) {
  const accentText =
    accent === 'green'
      ? 'text-emerald-600'
      : accent === 'red'
        ? 'text-rose-600'
        : accent === 'blue'
          ? 'text-blue-600'
          : 'text-slate-800'

  return (
    <div className="relative flex flex-col justify-between overflow-hidden border-slate-100 bg-white p-5 [&:not(:last-child)]:border-r">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-500">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <div className="mt-4">
        <div
          className={cn(
            'font-mono text-2xl font-semibold tabular tracking-tight',
            locked ? 'text-slate-300' : accentText,
          )}
        >
          {locked ? '— — —' : value}
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400">
          {locked ? 'Awaiting reconciliation' : sub}
        </div>
      </div>
      {!locked && children}
    </div>
  )
}

export function TelemetryStrip({
  reconciled,
  metrics,
  financialLeakageOverride,
}: {
  reconciled: boolean
  metrics: BatchMetrics
  financialLeakageOverride?: number
}) {
  const locked = !reconciled
  const leakage =
    financialLeakageOverride !== undefined
      ? financialLeakageOverride
      : metrics.financialLeakage

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        label="Gross Ingested Volume"
        value={formatINR(metrics.grossVolume)}
        sub={`${metrics.totalCount} orders · dual-stream ingested`}
        accent="neutral"
        locked={locked}
        icon={<Wallet className="h-4 w-4" />}
      />
      <Kpi
        label="Batch Match Rate"
        value={`${metrics.matchRate}%`}
        sub={
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
              {metrics.autoClosedCount} verified auto-closed
            </span>
            <span>· zero human touch</span>
          </span>
        }
        accent="green"
        locked={locked}
        icon={<GitCompareArrows className="h-4 w-4" />}
      >
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${metrics.matchRate}%` }}
          />
        </div>
      </Kpi>
      <Kpi
        label="Financial Leakage / Variance"
        value={
          <span className="transition-all duration-500">
            {formatINR(leakage)}
          </span>
        }
        sub={
          leakage > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200">
                Recoverable leakage
              </span>
              <span>· {metrics.exceptionCount} exceptions</span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
              Zero leakage detected
            </span>
          )
        }
        accent="red"
        locked={locked}
        icon={<TrendingDown className="h-4 w-4" />}
      />
      <Kpi
        label="Verification Standard"
        value={
          <span className="flex items-center gap-1.5 text-base">
            <ShieldCheck className="h-4 w-4 text-emerald-600" strokeWidth={2.4} />
            <span className="text-emerald-600">Epsilon Verified</span>
          </span>
        }
        sub="Deterministic tolerance ≤ ₹0.05"
        accent="green"
        locked={locked}
        icon={<ShieldCheck className="h-4 w-4" />}
      />
    </div>
  )
}
