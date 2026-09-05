'use client'

import { useEffect, useRef } from 'react'
import type { LogLine, LogLevel } from '@/lib/audit-log'
import { cn } from '@/lib/utils'
import { Activity } from 'lucide-react'

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: 'text-slate-600',
  ok: 'text-emerald-600',
  warn: 'text-amber-600',
  crit: 'text-rose-600',
  sys: 'text-blue-600',
}

const LEVEL_TAG: Record<LogLevel, string> = {
  info: 'Info',
  ok: 'OK',
  warn: 'Warn',
  crit: 'Crit',
  sys: 'Sys',
}

const LEVEL_PILL: Record<LogLevel, string> = {
  info: 'bg-slate-100 text-slate-600',
  ok: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warn: 'bg-amber-50 text-amber-700 border border-amber-200',
  crit: 'bg-rose-50 text-rose-700 border border-rose-200',
  sys: 'bg-blue-50 text-blue-700 border border-blue-200',
}

export function AuditTerminal({
  lines,
  progress,
  running,
}: {
  lines: LogLine[]
  progress: number
  running: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
            <Activity className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-slate-800">
              Live Reconciliation Feed
            </div>
            <div className="text-[11px] text-slate-400">
              Deterministic audit pipeline · real-time event stream
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {running && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] text-blue-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              Running
            </span>
          )}
          <span className="font-mono text-[12px] tabular text-slate-500">
            {progress.toString().padStart(3, ' ')}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto px-4 py-3 text-[12px] leading-relaxed"
      >
        {lines.length === 0 && (
          <div className="flex items-center gap-2 py-2 text-slate-400">
            <span className="text-slate-300">›</span>
            Awaiting execution trigger…
          </div>
        )}
        {lines.map((l, i) => (
          <div key={i} className="flex items-baseline gap-3 py-1 border-b border-slate-50 last:border-0">
            <span className="shrink-0 font-mono text-[10px] tabular text-slate-400">
              {l.time}
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                LEVEL_PILL[l.level],
              )}
            >
              {LEVEL_TAG[l.level]}
            </span>
            <span className={cn('text-pretty', LEVEL_COLOR[l.level])}>
              {l.text}
            </span>
          </div>
        ))}
        {running && (
          <div className="flex items-center gap-3 py-1">
            <span className="font-mono text-[10px] text-slate-400">···</span>
            <span className="inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-blue-400" />
            <span className="text-slate-400">Processing…</span>
          </div>
        )}
      </div>
    </div>
  )
}
