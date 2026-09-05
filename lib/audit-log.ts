export type LogLevel = 'info' | 'ok' | 'warn' | 'crit' | 'sys'

export interface LogLine {
  time: string
  text: string
  level: LogLevel
  progress: number
  delay: number // ms after the previous line
}

// Scripted millisecond-by-millisecond audit trail for the reconciliation loop.
export const AUDIT_LOG: LogLine[] = [
  {
    time: '00:00.02',
    text: 'ReconPilot kernel online — deterministic epsilon mode (≤ ₹0.05) engaged.',
    level: 'sys',
    progress: 3,
    delay: 120,
  },
  {
    time: '00:00.12',
    text: 'Ingesting 55 internal ledger entries from Merchant Order DB...',
    level: 'info',
    progress: 10,
    delay: 220,
  },
  {
    time: '00:00.31',
    text: 'Ingesting 55 settlement legs from Razorpay Payout Batch #RZP-2026-0905...',
    level: 'info',
    progress: 18,
    delay: 240,
  },
  {
    time: '00:00.35',
    text: 'Running deterministic paise-level fee validation against RBI MDR matrix...',
    level: 'info',
    progress: 27,
    delay: 260,
  },
  {
    time: '00:00.54',
    text: 'UPI 0% • Domestic Card 2% • Int\'l Amex 3% + 18% GST tiers loaded.',
    level: 'sys',
    progress: 35,
    delay: 220,
  },
  {
    time: '00:00.71',
    text: 'Cross-joining ledger ↔ payout on order_id · matching gross → fee → GST → net.',
    level: 'info',
    progress: 46,
    delay: 260,
  },
  {
    time: '00:00.82',
    text: '42 records verified with zero variance (Auto-Closed).',
    level: 'ok',
    progress: 62,
    delay: 300,
  },
  {
    time: '00:01.15',
    text: 'Isolating 13 unmatched items → Initiating diagnostic triage...',
    level: 'warn',
    progress: 71,
    delay: 300,
  },
  {
    time: '00:01.38',
    text: '3 items: settlement webhook absent → GATEWAY DROPPED / WEBHOOK LOSS.',
    level: 'crit',
    progress: 78,
    delay: 240,
  },
  {
    time: '00:01.62',
    text: '4 items: net credit pending → T+2 BANK CLEARING FLOAT (timing).',
    level: 'warn',
    progress: 84,
    delay: 240,
  },
  {
    time: '00:01.87',
    text: '4 items: MDR tier mismatch → OVER-DEDUCTION SURCHARGE (recoverable).',
    level: 'warn',
    progress: 90,
    delay: 240,
  },
  {
    time: '00:02.06',
    text: '2 items: refund clawback delta → DEBIT ADJUSTMENT REQUIRED.',
    level: 'crit',
    progress: 95,
    delay: 220,
  },
  {
    time: '00:02.28',
    text: 'Recoverable financial leakage quantified: ₹2,418.50 across 6 disputable rows.',
    level: 'info',
    progress: 98,
    delay: 240,
  },
  {
    time: '00:02.44',
    text: 'Audit docket sealed · hash 0x9f3a…c2 · batch reconciled & signed.',
    level: 'ok',
    progress: 100,
    delay: 220,
  },
]
