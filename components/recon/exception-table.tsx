'use client'

import type { Txn } from '@/lib/recon-data'
import { formatINR } from '@/lib/recon-data'
import { cn } from '@/lib/utils'
import {
  BankStatusBadge,
  InstrumentTag,
  SeverityBadge,
  VarianceBadge,
  DisputeInFlightBadge,
} from './badges'
import { ArrowUpRight, CheckCircle2, Search } from 'lucide-react'

export function ExceptionTable({
  txns,
  onInspect,
  disputedIds,
}: {
  txns: Txn[]
  onInspect: (t: Txn) => void
  disputedIds?: Set<string>
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-medium text-slate-500">
              <th className="px-4 py-3">Transaction / Order</th>
              <th className="px-4 py-3">Instrument</th>
              <th className="px-4 py-3 text-right">Expected Net</th>
              <th className="px-4 py-3 text-right">Actual Net</th>
              <th className="px-4 py-3 text-right">Variance</th>
              <th className="px-4 py-3">Root Cause</th>
              <th className="px-4 py-3">Recommended Action</th>
              <th className="px-4 py-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => {
              const isException = t.status === 'exception'
              const isDisputed = disputedIds?.has(t.id) ?? false
              return (
                <tr
                  key={t.id}
                  className={cn(
                    'group border-b border-slate-100 transition-colors last:border-0',
                    isException
                      ? isDisputed
                        ? 'hover:bg-blue-50/20'
                        : 'hover:bg-rose-50/10'
                      : 'hover:bg-emerald-50/20',
                  )}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      {isException ? (
                        <span
                          className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full mt-0.5',
                            isDisputed
                              ? 'bg-blue-500 animate-pulse'
                              : t.severity === 'critical'
                                ? 'bg-rose-500'
                                : t.severity === 'high'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400',
                          )}
                        />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                      )}
                      <div className="leading-tight">
                        <div className="font-mono text-[12px] font-medium text-slate-800">
                          {t.id}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {t.orderId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <InstrumentTag instrument={t.instrument} />
                    <div className="mt-1.5">
                      <BankStatusBadge status={t.bankStatus} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-top font-mono text-[12px] tabular text-slate-700">
                    {formatINR(t.expected.net)}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right align-top font-mono text-[12px] tabular',
                      isException ? 'text-slate-800 font-medium' : 'text-slate-700',
                    )}
                  >
                    {formatINR(t.actual.net)}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <VarianceBadge value={t.variance} />
                  </td>
                  <td className="max-w-[280px] px-4 py-3 align-top">
                    {isException ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isDisputed ? (
                            <DisputeInFlightBadge />
                          ) : (
                            <SeverityBadge severity={t.severity!} />
                          )}
                          <span className="text-[11px] font-medium text-slate-700">
                            {t.categoryLabel}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[11px] leading-snug text-slate-500">
                          {t.rootCause}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Paise-matched · auto-closed
                      </span>
                    )}
                  </td>
                  <td className="max-w-[180px] px-4 py-3 align-top">
                    <span className="text-[11px] leading-snug text-slate-500">
                      {isException ? t.action : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    {isException ? (
                      <button
                        type="button"
                        onClick={() => onInspect(t)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Search className="h-3 w-3" />
                        Inspect
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300">sealed</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {txns.length === 0 && (
        <div className="px-4 py-10 text-center text-[12px] text-slate-400">
          No records match this filter.
        </div>
      )}
    </div>
  )
}
