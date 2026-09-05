import type { BankStatus, Severity } from '@/lib/recon-data'
import { cn } from '@/lib/utils'

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, { label: string; cls: string }> = {
    critical: {
      label: 'Critical',
      cls: 'text-rose-700 border-rose-200 bg-rose-50',
    },
    high: {
      label: 'High',
      cls: 'text-amber-700 border-amber-200 bg-amber-50',
    },
    medium: {
      label: 'Medium',
      cls: 'text-slate-600 border-slate-200 bg-slate-100',
    },
  }
  const s = map[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        s.cls,
      )}
    >
      {s.label}
    </span>
  )
}

export function DisputeInFlightBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
      <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
      Dispute In Flight
    </span>
  )
}

export function VarianceBadge({ value }: { value: number }) {
  if (Math.abs(value) < 0.005) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs tabular text-emerald-700">
        ₹0.00
      </span>
    )
  }
  const negative = value < 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs tabular font-medium',
        negative
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
      )}
    >
      {negative ? '−' : '+'}₹
      {Math.abs(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  )
}

export function BankStatusBadge({ status }: { status: BankStatus }) {
  const map: Record<BankStatus, { label: string; cls: string }> = {
    settled: {
      label: 'Settled',
      cls: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    },
    pending_bank_clearance: {
      label: 'Pending clearance',
      cls: 'text-amber-700 border-amber-200 bg-amber-50',
    },
    webhook_lost: {
      label: 'Webhook lost',
      cls: 'text-rose-700 border-rose-200 bg-rose-50',
    },
    refund_pending: {
      label: 'Refund pending',
      cls: 'text-amber-700 border-amber-200 bg-amber-50',
    },
  }
  const s = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]',
        s.cls,
      )}
    >
      {s.label}
    </span>
  )
}

export function InstrumentTag({ instrument }: { instrument: string }) {
  const rate =
    instrument === 'UPI'
      ? '0%'
      : instrument === 'Domestic Card'
        ? '2%'
        : '3%'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
      <span>{instrument}</span>
      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 tabular">
        {rate} MDR
      </span>
    </span>
  )
}
