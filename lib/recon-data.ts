// Synthetic reconciliation batch for ReconPilot OS.
// All figures are held in paise-accurate rupee floats and formatted with
// tabular monospaced digits in the UI. Fee math follows the RBI MDR matrix:
//   UPI            -> 0% MDR
//   Domestic Card  -> 2% MDR
//   Int'l Amex     -> 3% MDR
// GST is levied at 18% on the MDR fee component.

export const GST_RATE = 0.18
export const EPSILON = 0.05 // ₹0.05 deterministic tolerance

export type Instrument = 'UPI' | 'Domestic Card' | "Int'l Amex"

export type ExceptionCategory =
  | 'gateway_dropped'
  | 'bank_float'
  | 'mdr_overcharge'
  | 'refund_clawback'

export type Severity = 'critical' | 'high' | 'medium'

export type BankStatus =
  | 'settled'
  | 'pending_bank_clearance'
  | 'webhook_lost'
  | 'refund_pending'

export interface FeeBreakdown {
  gross: number
  mdrRate: number
  fee: number
  gst: number
  net: number
}

export interface Txn {
  id: string // pay_...
  orderId: string // ord_...
  merchant: string
  sku: string
  instrument: Instrument
  timestamp: string
  bankStatus: BankStatus
  status: 'auto_closed' | 'exception'
  expected: FeeBreakdown
  actual: FeeBreakdown
  variance: number // actual.net - expected.net
  // exception-only fields
  category?: ExceptionCategory
  categoryLabel?: string
  severity?: Severity
  rootCause?: string
  action?: string
  actionLabel?: string
}

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
  'Kiranakart Retail',
  'Zeplon Electronics',
  'Aarna Ayurveda',
  'MetroThread Apparel',
  'Nova Nutrition',
  'Pixelforge Gadgets',
  'Homecraft Living',
  'Vaayu Mobility',
  'Saffron Gourmet',
  'Lumen Beauty Co',
]

const SKUS = [
  'Bluetooth Earbuds Pro',
  'Cotton Kurta Set',
  'Stainless Steel Bottle',
  'Whey Protein 1kg',
  'Smart LED Bulb x4',
  'Yoga Mat Premium',
  'Ceramic Dinner Set',
  'Wireless Mouse',
  'Organic Green Tea',
  'Vitamin C Serum',
  'Mechanical Keyboard',
  'Running Shoes',
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

function payId(seed: number) {
  return `pay_RZP${hex(seed, 11)}`
}
function orderId(seed: number) {
  return `ord_${hex(seed + 7, 12)}`
}

function ts(seconds: number) {
  const base = new Date('2026-09-05T23:14:00+05:30').getTime()
  const d = new Date(base + seconds * 1000)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

// ---- 42 auto-closed (zero-variance) records ----------------------------------
const CLEAN_GROSS = [
  1499, 2599, 899, 3499, 1299, 799, 2199, 1099, 649, 1899, 4299, 3199, 1799,
  2499, 949, 1399, 5499, 2899, 1199, 749, 3899, 1599, 2299, 999, 1699, 4599,
  1249, 3299, 869, 2049, 1949, 6299, 1349, 2749, 1149, 579, 3599, 1499, 2199,
  899, 4899, 1799,
]

const cleanTxns: Txn[] = CLEAN_GROSS.map((gross, i) => {
  const instrument = INSTRUMENTS[i % INSTRUMENTS.length]
  const bd = fees(gross, MDR[instrument])
  return {
    id: payId(1000 + i),
    orderId: orderId(1000 + i),
    merchant: MERCHANTS[i % MERCHANTS.length],
    sku: SKUS[i % SKUS.length],
    instrument,
    timestamp: ts(i * 13 + 2),
    bankStatus: 'settled',
    status: 'auto_closed',
    expected: bd,
    actual: bd,
    variance: 0,
  }
})

// ---- 13 exceptions -----------------------------------------------------------
// helper to build an exception with an actual settlement that differs from expected
function exception(
  seed: number,
  gross: number,
  instrument: Instrument,
  actualNet: number,
  bankStatus: BankStatus,
  category: ExceptionCategory,
  categoryLabel: string,
  severity: Severity,
  rootCause: string,
  action: string,
  actionLabel: string,
  actualOverride?: Partial<FeeBreakdown>,
  merchantIdx = seed,
): Txn {
  const expected = fees(gross, MDR[instrument])
  const actual: FeeBreakdown = {
    gross,
    mdrRate: instrument in MDR ? MDR[instrument] : 0,
    fee: expected.fee,
    gst: expected.gst,
    net: actualNet,
    ...actualOverride,
  }
  return {
    id: payId(seed),
    orderId: orderId(seed),
    merchant: MERCHANTS[merchantIdx % MERCHANTS.length],
    sku: SKUS[merchantIdx % SKUS.length],
    instrument,
    timestamp: ts(seed % 700),
    bankStatus,
    status: 'exception',
    expected,
    actual,
    variance: round2(actualNet - expected.net),
    category,
    categoryLabel,
    severity,
    rootCause,
    action,
    actionLabel,
  }
}

// 3x Gateway Dropped Event / Webhook Loss (variance = -100% of order value)
const gatewayDropped: Txn[] = [12750, 8990, 15499].map((gross, i) =>
  exception(
    200 + i,
    gross,
    'UPI',
    0,
    'webhook_lost',
    'gateway_dropped',
    'Gateway Dropped Event / Webhook Loss',
    'critical',
    'Payment captured on gateway but settlement webhook never delivered to merchant ingest endpoint. Internal ledger shows the order as PAID while the payout batch has no matching credit leg (net = ₹0.00).',
    'Poll RZP GET /v1/payments/{id} & Re-queue',
    'Re-queue Webhook',
    { fee: 0, gst: 0 },
    i,
  ),
)

// 4x T+2 Bank Clearing Float (pending_bank_clearance)
const bankFloat: Txn[] = [15600, 9800, 22400, 6750].map((gross, i) => {
  const instrument: Instrument = i % 2 === 0 ? 'Domestic Card' : 'UPI'
  const expected = fees(gross, MDR[instrument])
  return exception(
    300 + i,
    gross,
    instrument,
    0,
    'pending_bank_clearance',
    'bank_float',
    'T+2 Bank Clearing Float',
    'medium',
    `Funds captured and fees deducted correctly, but the beneficiary bank credit is in the standard T+2 clearing float. Expected net of ₹${expected.net.toLocaleString('en-IN')} is authorised but not yet landed — timing gap, not leakage.`,
    'Hold Alert; Defer to Next Payout Cycle',
    'Defer to T+2',
    { fee: 0, gst: 0 },
    i + 3,
  )
})

// 4x MDR/GST Over-Deduction Surcharge (domestic card misclassified as int'l 3%)
const mdrOvercharge: Txn[] = [18500, 24200, 31500, 42750].map((gross, i) => {
  // expected: domestic card 2%. actual: charged as int'l 3%.
  const expected = fees(gross, MDR['Domestic Card'])
  const wrong = fees(gross, MDR["Int'l Amex"])
  return exception(
    400 + i,
    gross,
    'Domestic Card',
    wrong.net,
    'settled',
    'mdr_overcharge',
    'MDR/GST Over-Deduction Surcharge',
    'high',
    `Domestic card transaction misclassified into the International (Amex 3%) MDR tier. Gateway deducted ₹${wrong.fee.toLocaleString('en-IN')} + ₹${wrong.gst.toLocaleString('en-IN')} GST instead of the correct ₹${expected.fee.toLocaleString('en-IN')} + ₹${expected.gst.toLocaleString('en-IN')} GST. Recoverable surcharge leakage.`,
    'Generate Dispute Docket',
    'Generate Dispute',
    { fee: wrong.fee, gst: wrong.gst },
    i + 6,
  )
})

// 2x Partial Refund Clawback Mismatch
const refundClawback: Txn[] = [
  { gross: 7999, actualNet: 0, clawback: 620.49 },
  { gross: 5499, actualNet: 0, clawback: 418.0 },
].map((r, i) => {
  const instrument: Instrument = 'Domestic Card'
  const expected = fees(r.gross, MDR[instrument])
  // A partial refund was issued; the clawback amount reflected in the payout
  // does not match the refunded principal recorded in the internal ledger.
  const actualNet = round2(expected.net - r.clawback)
  return exception(
    500 + i,
    r.gross,
    instrument,
    actualNet,
    'refund_pending',
    'refund_clawback',
    'Partial Refund Clawback Mismatch',
    'critical',
    `Partial refund settled against the order but the clawback debit in the payout batch is off by ₹${r.clawback.toLocaleString('en-IN')} versus the refunded principal in the internal ledger. Net settlement understated.`,
    'Debit Adjustment Required',
    'Raise Adjustment',
    undefined,
    i + 8,
  )
})

export const EXCEPTIONS: Txn[] = [
  ...gatewayDropped,
  ...mdrOvercharge,
  ...refundClawback,
  ...bankFloat,
]

export const TRANSACTIONS: Txn[] = [...cleanTxns, ...EXCEPTIONS]

// ---- Derived batch metrics ---------------------------------------------------
export const BATCH_ID = 'RZP-2026-0905'

export const GROSS_VOLUME = round2(
  TRANSACTIONS.reduce((s, t) => s + t.expected.gross, 0),
)

export const TOTAL_COUNT = TRANSACTIONS.length // 55
export const AUTO_CLOSED_COUNT = cleanTxns.length // 42
export const EXCEPTION_COUNT = EXCEPTIONS.length // 13
export const CRITICAL_COUNT = EXCEPTIONS.filter(
  (t) => t.severity === 'critical',
).length // 5

export const MATCH_RATE = round2((AUTO_CLOSED_COUNT / TOTAL_COUNT) * 100) // 76.36

// Recoverable financial leakage = surcharge over-deductions + refund clawback
// mismatches (gateway/float deltas are recoverable/timing, not leakage).
export const FINANCIAL_LEAKAGE = round2(
  [...mdrOvercharge, ...refundClawback].reduce(
    (s, t) => s + Math.abs(t.variance),
    0,
  ),
)

// Standard batch metrics object — mirrors the shape used by batch-profiles.ts
export const STANDARD_METRICS = {
  batchId: BATCH_ID,
  totalCount: TOTAL_COUNT,
  autoClosedCount: AUTO_CLOSED_COUNT,
  exceptionCount: EXCEPTION_COUNT,
  criticalCount: CRITICAL_COUNT,
  matchRate: MATCH_RATE,
  grossVolume: GROSS_VOLUME,
  financialLeakage: FINANCIAL_LEAKAGE,
}

export function formatINR(n: number, withDecimals = true): string {
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  })}`
}

export function categoryFilter(t: Txn, cat: ExceptionCategory) {
  return t.category === cat
}
