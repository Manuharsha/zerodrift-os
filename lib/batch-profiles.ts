// Synthetic batch profiles for the Batch Scenario Switcher.
// All three profiles use the same deterministic fee math as the standard batch.

import type { Txn, Instrument, BankStatus, ExceptionCategory, Severity, FeeBreakdown } from './recon-data'
import { GST_RATE, EPSILON } from './recon-data'

// ─── Fee helpers (mirrors recon-data.ts) ────────────────────────────────────

const MDR: Record<Instrument, number> = {
  UPI: 0,
  'Domestic Card': 0.02,
  "Int'l Amex": 0.03,
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function fees(gross: number, rate: number): FeeBreakdown {
  const fee = round2(gross * rate)
  const gst = round2(fee * GST_RATE)
  const net = round2(gross - fee - gst)
  return { gross, mdrRate: rate, fee, gst, net }
}

const MERCHANTS = [
  'Kiranakart Retail', 'Zeplon Electronics', 'Aarna Ayurveda',
  'MetroThread Apparel', 'Nova Nutrition', 'Pixelforge Gadgets',
  'Homecraft Living', 'Vaayu Mobility', 'Saffron Gourmet', 'Lumen Beauty Co',
]
const SKUS = [
  'Bluetooth Earbuds Pro', 'Cotton Kurta Set', 'Stainless Steel Bottle',
  'Whey Protein 1kg', 'Smart LED Bulb x4', 'Yoga Mat Premium',
  'Ceramic Dinner Set', 'Wireless Mouse', 'Organic Green Tea', 'Vitamin C Serum',
  'Mechanical Keyboard', 'Running Shoes',
]
const INSTRUMENTS: Instrument[] = ['UPI', 'Domestic Card', "Int'l Amex"]

function hex(seed: number, len: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  let s = seed * 2654435761
  for (let i = 0; i < len; i++) {
    s = (s ^ (s << 13)) >>> 0
    s = (s ^ (s >>> 17)) >>> 0
    s = (s ^ (s << 5)) >>> 0
    out += chars[s % chars.length]
  }
  return out
}

function payId(seed: number) { return `pay_RZP${hex(seed, 11)}` }
function orderId(seed: number) { return `ord_${hex(seed + 7, 12)}` }
function ts(seconds: number) {
  const base = new Date('2026-09-05T23:14:00+05:30').getTime()
  const d = new Date(base + seconds * 1000)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function exception(
  seed: number, gross: number, instrument: Instrument, actualNet: number,
  bankStatus: BankStatus, category: ExceptionCategory, categoryLabel: string,
  severity: Severity, rootCause: string, action: string, actionLabel: string,
  actualOverride?: Partial<FeeBreakdown>, merchantIdx = seed,
): Txn {
  const expected = fees(gross, MDR[instrument])
  const actual: FeeBreakdown = {
    gross, mdrRate: MDR[instrument], fee: expected.fee, gst: expected.gst,
    net: actualNet, ...actualOverride,
  }
  return {
    id: payId(seed), orderId: orderId(seed),
    merchant: MERCHANTS[merchantIdx % MERCHANTS.length],
    sku: SKUS[merchantIdx % SKUS.length],
    instrument, timestamp: ts(seed % 700), bankStatus,
    status: 'exception', expected, actual,
    variance: round2(actualNet - expected.net),
    category, categoryLabel, severity, rootCause, action, actionLabel,
  }
}

// ─── DIWALI FLASH SALE SURGE (75 Records, ~62% match, ₹6,850 leakage) ───────

const DIWALI_CLEAN_GROSS = [
  1499, 2599, 899, 3499, 1299, 799, 2199, 1099, 649, 1899,
  4299, 3199, 1799, 2499, 949, 1399, 5499, 2899, 1199, 749,
  3899, 1599, 2299, 999, 1699, 4599, 1249, 3299, 869, 2049,
  1949, 6299, 1349, 2749, 1149, 579, 3599, 1499, 2199, 899,
  4899, 1799, 1599, 2899, 3299, 7499, 5999,
]

const diwaliClean: Txn[] = DIWALI_CLEAN_GROSS.map((gross, i) => {
  const instrument = INSTRUMENTS[i % INSTRUMENTS.length]
  const bd = fees(gross, MDR[instrument])
  return {
    id: payId(2000 + i), orderId: orderId(2000 + i),
    merchant: MERCHANTS[i % MERCHANTS.length],
    sku: SKUS[i % SKUS.length], instrument,
    timestamp: ts(i * 9 + 1), bankStatus: 'settled',
    status: 'auto_closed', expected: bd, actual: bd, variance: 0,
  }
})

// 7x dropped webhooks (high-traffic spike)
const diwaliDropped: Txn[] = [12750, 8990, 15499, 22100, 9800, 18500, 11200].map((gross, i) =>
  exception(
    2200 + i, gross, 'UPI', 0, 'webhook_lost', 'gateway_dropped',
    'Gateway Dropped Event / Webhook Loss', 'critical',
    'Payment captured on gateway but settlement webhook never delivered. Diwali traffic spike caused webhook queue saturation.',
    'Poll RZP GET /v1/payments/{id} & Re-queue', 'Re-queue Webhook',
    { fee: 0, gst: 0 }, i,
  )
)

// 6x MDR overcharge (higher dispute volume)
const diwaliMdr: Txn[] = [18500, 24200, 31500, 42750, 19800, 27600].map((gross, i) => {
  const expected = fees(gross, MDR['Domestic Card'])
  const wrong = fees(gross, MDR["Int'l Amex"])
  return exception(
    2300 + i, gross, 'Domestic Card', wrong.net, 'settled',
    'mdr_overcharge', 'MDR/GST Over-Deduction Surcharge', 'high',
    `Domestic card misclassified into Amex 3% tier during high-load Diwali window. Gateway deducted ₹${wrong.fee.toLocaleString('en-IN')} + GST instead of ₹${expected.fee.toLocaleString('en-IN')}.`,
    'Generate Dispute Docket', 'Generate Dispute',
    { fee: wrong.fee, gst: wrong.gst }, i + 6,
  )
})

// 4x refund clawback
const diwaliRefund: Txn[] = [
  { gross: 7999, clawback: 620.49 }, { gross: 5499, clawback: 418.0 },
  { gross: 12999, clawback: 980.0 }, { gross: 9499, clawback: 720.5 },
].map((r, i) => {
  const instrument: Instrument = 'Domestic Card'
  const expected = fees(r.gross, MDR[instrument])
  const actualNet = round2(expected.net - r.clawback)
  return exception(
    2400 + i, r.gross, instrument, actualNet, 'refund_pending',
    'refund_clawback', 'Partial Refund Clawback Mismatch', 'critical',
    `Partial refund settled but clawback debit off by ₹${r.clawback.toLocaleString('en-IN')} vs internal ledger.`,
    'Debit Adjustment Required', 'Raise Adjustment', undefined, i + 8,
  )
})

// 11x bank float (T+2 delays under surge)
const diwaliBankFloat: Txn[] = [15600, 9800, 22400, 6750, 18900, 12300, 8400, 25000, 11500, 7200, 16800].map((gross, i) => {
  const instrument: Instrument = i % 2 === 0 ? 'Domestic Card' : 'UPI'
  const expected = fees(gross, MDR[instrument])
  return exception(
    2500 + i, gross, instrument, 0, 'pending_bank_clearance',
    'bank_float', 'T+2 Bank Clearing Float', 'medium',
    `Funds captured and fees deducted, but beneficiary bank credit in T+2 clearing float. Expected net of ₹${expected.net.toLocaleString('en-IN')} authorised but not landed.`,
    'Hold Alert; Defer to Next Payout Cycle', 'Defer to T+2',
    { fee: 0, gst: 0 }, i + 3,
  )
})

export const DIWALI_EXCEPTIONS: Txn[] = [
  ...diwaliDropped, ...diwaliMdr, ...diwaliRefund, ...diwaliBankFloat,
]
export const DIWALI_TRANSACTIONS: Txn[] = [...diwaliClean, ...DIWALI_EXCEPTIONS]

export const DIWALI_METRICS = {
  batchId: 'RZP-2026-DIWALI',
  totalCount: DIWALI_TRANSACTIONS.length,
  autoClosedCount: diwaliClean.length,
  exceptionCount: DIWALI_EXCEPTIONS.length,
  criticalCount: DIWALI_EXCEPTIONS.filter(t => t.severity === 'critical').length,
  matchRate: round2((diwaliClean.length / DIWALI_TRANSACTIONS.length) * 100),
  grossVolume: round2(DIWALI_TRANSACTIONS.reduce((s, t) => s + t.expected.gross, 0)),
  financialLeakage: round2([...diwaliMdr, ...diwaliRefund].reduce((s, t) => s + Math.abs(t.variance), 0)),
}

// ─── CLEAN SETTLEMENT RUN (40 Records, 97.5% match, near-zero leakage) ───────

const CLEAN_GROSS_RUN = [
  1499, 2599, 899, 3499, 1299, 799, 2199, 1099, 649, 1899,
  4299, 3199, 1799, 2499, 949, 1399, 5499, 2899, 1199, 749,
  3899, 1599, 2299, 999, 1699, 4599, 1249, 3299, 869, 2049,
  1949, 6299, 1349, 2749, 1149, 579, 3599, 1499, 2199,
]

const cleanRunClean: Txn[] = CLEAN_GROSS_RUN.map((gross, i) => {
  const instrument = INSTRUMENTS[i % INSTRUMENTS.length]
  const bd = fees(gross, MDR[instrument])
  return {
    id: payId(3000 + i), orderId: orderId(3000 + i),
    merchant: MERCHANTS[i % MERCHANTS.length],
    sku: SKUS[i % SKUS.length], instrument,
    timestamp: ts(i * 11 + 3), bankStatus: 'settled',
    status: 'auto_closed', expected: bd, actual: bd, variance: 0,
  }
})

// 1x bank clearing latency float (only exception)
const cleanRunException: Txn[] = [15600].map((gross, i) => {
  const instrument: Instrument = 'Domestic Card'
  const expected = fees(gross, MDR[instrument])
  return exception(
    3100 + i, gross, instrument, 0, 'pending_bank_clearance',
    'bank_float', 'T+2 Bank Clearing Float', 'medium',
    `Funds captured and fees deducted correctly. Beneficiary bank credit in standard T+2 clearing float. Expected net of ₹${expected.net.toLocaleString('en-IN')} authorised — timing gap only.`,
    'Hold Alert; Defer to Next Payout Cycle', 'Defer to T+2',
    { fee: 0, gst: 0 }, i + 3,
  )
})

export const CLEAN_RUN_EXCEPTIONS: Txn[] = cleanRunException
export const CLEAN_RUN_TRANSACTIONS: Txn[] = [...cleanRunClean, ...CLEAN_RUN_EXCEPTIONS]

export const CLEAN_RUN_METRICS = {
  batchId: 'RZP-2026-CLEANRUN',
  totalCount: CLEAN_RUN_TRANSACTIONS.length,
  autoClosedCount: cleanRunClean.length,
  exceptionCount: CLEAN_RUN_EXCEPTIONS.length,
  criticalCount: 0,
  matchRate: round2((cleanRunClean.length / CLEAN_RUN_TRANSACTIONS.length) * 100),
  grossVolume: round2(CLEAN_RUN_TRANSACTIONS.reduce((s, t) => s + t.expected.gross, 0)),
  financialLeakage: 0,
}

// ─── Profile type ─────────────────────────────────────────────────────────────

export type BatchProfileId = 'standard' | 'diwali' | 'clean'

export interface BatchProfile {
  id: BatchProfileId
  label: string
  description: string
  tag: string
  transactions: Txn[]
  exceptions: Txn[]
  autoClosed: Txn[]
  metrics: {
    batchId: string
    totalCount: number
    autoClosedCount: number
    exceptionCount: number
    criticalCount: number
    matchRate: number
    grossVolume: number
    financialLeakage: number
  }
}

// Exported so page.tsx can reference standard profile's data
export { DIWALI_EXCEPTIONS as diwaliExceptions }
