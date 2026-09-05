'use client'

import { cn } from '@/lib/utils'
import { Loader2, Play, RotateCcw } from 'lucide-react'

export type FilterKey = 'all' | 'auto' | 'exceptions' | 'critical'

interface BatchCounts {
  totalCount: number
  autoClosedCount: number
  exceptionCount: number
  criticalCount: number
}

export function ControlsBar({
  phase,
  onExecute,
  activeFilter,
  onFilter,
  counts,
}: {
  phase: 'idle' | 'running' | 'done'
  onExecute: () => void
  activeFilter: FilterKey
  onFilter: (f: FilterKey) => void
  counts: BatchCounts
}) {
  const running = phase === 'running'
  const done = phase === 'done'

  const TABS: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'All Records', count: counts.totalCount },
    { key: 'auto', label: 'Auto-Closed', count: counts.autoClosedCount },
    { key: 'exceptions', label: 'Exception List', count: counts.exceptionCount },
    { key: 'critical', label: 'Critical Disputes', count: counts.criticalCount },
  ]

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map((t) => {
          const active = activeFilter === t.key
          const disabled = !done
          const critical = t.key === 'critical'
          const exceptions = t.key === 'exceptions'
          return (
            <button
              key={t.key}
              type="button"
              disabled={disabled}
              onClick={() => onFilter(t.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40',
                active
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-500/20'
                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-700',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular',
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : critical
                      ? 'bg-rose-50 text-rose-600'
                      : exceptions
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-200 text-slate-500',
                )}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Primary action — Gemini animated gradient */}
      <button
        type="button"
        id="execute-recon-btn"
        onClick={onExecute}
        disabled={running}
        className={cn(
          'group relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all',
          running
            ? 'cursor-wait bg-blue-400/80'
            : done
              ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 animate-gradient shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30'
              : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 animate-gradient shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 pulse-ring',
        )}
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Running verification…
          </>
        ) : done ? (
          <>
            <RotateCcw className="h-4 w-4" />
            Re-run Reconciliation Loop
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <Play className="h-4 w-4" fill="currentColor" />
            Execute Autonomous Reconciliation Loop
          </>
        )}
      </button>
    </div>
  )
}
