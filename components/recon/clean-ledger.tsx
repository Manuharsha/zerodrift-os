'use client'

import { useState } from 'react'
import type { Txn } from '@/lib/recon-data'
import { formatINR } from '@/lib/recon-data'
import { cn } from '@/lib/utils'
import { CheckCircle2, ChevronDown } from 'lucide-react'
import { InstrumentTag } from './badges'

export function CleanLedger({ txns, count }: { txns: Txn[]; count: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <span className="text-[13px] font-semibold text-slate-700">
            Auto-Closed Clean Ledger
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 tabular">
            {count} reconciled · zero variance
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="max-h-80 overflow-y-auto border-t border-slate-100">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-white border-b border-slate-100">
              <tr className="text-[11px] font-medium text-slate-500">
                <th className="px-4 py-2.5">Transaction</th>
                <th className="px-4 py-2.5">Instrument</th>
                <th className="px-4 py-2.5 text-right">Gross</th>
                <th className="px-4 py-2.5 text-right">Fee + GST</th>
                <th className="px-4 py-2.5 text-right">Net (matched)</th>
                <th className="px-4 py-2.5">Settled at</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-emerald-50/20"
                >
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">
                    {t.id}
                  </td>
                  <td className="px-4 py-2.5">
                    <InstrumentTag instrument={t.instrument} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px] tabular text-slate-700">
                    {formatINR(t.expected.gross)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px] tabular text-slate-400">
                    {formatINR(t.expected.fee + t.expected.gst)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px] tabular font-medium text-slate-800">
                    {formatINR(t.expected.net)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400 tabular">
                    {t.timestamp}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
