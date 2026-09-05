'use client'

import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Database,
  Landmark,
  Sparkles,
} from 'lucide-react'

interface DropzoneProps {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  fields: string
  accept: string
  file: File | null
  onFile: (f: File) => void
}

function Dropzone({ id, title, subtitle, icon, fields, accept, file, onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files[0]
      if (f) onFile(f)
    },
    [onFile],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all',
        dragging
          ? 'border-blue-400 bg-blue-50'
          : file
            ? 'border-emerald-300 bg-emerald-50/50'
            : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30',
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          file ? 'bg-emerald-100' : 'bg-white shadow-sm',
        )}
      >
        {file ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          icon
        )}
      </div>
      <div>
        <div className="text-[13px] font-semibold text-slate-700">{title}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>
      </div>
      {file ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5">
          <FileText className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-mono text-[11px] text-emerald-700 max-w-[200px] truncate">
            {file.name}
          </span>
        </div>
      ) : (
        <div>
          <div className="text-[11px] font-medium text-blue-600">
            Drop file here or click to browse
          </div>
          <div className="mt-1 font-mono text-[10px] text-slate-400">{fields}</div>
        </div>
      )}
    </div>
  )
}

export function IngestionModal({
  open,
  onClose,
  onIngest,
}: {
  open: boolean
  onClose: () => void
  onIngest: () => void
}) {
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [ingesting, setIngesting] = useState(false)
  const [ingestProgress, setIngestProgress] = useState(0)

  function loadSample() {
    const sampleA = new File(
      ['order_id,amount,payment_method,expected_fee\nord_SAMPLE001,12500,UPI,0'],
      'merchant_ledger_sample.csv',
      { type: 'text/csv' },
    )
    const sampleB = new File(
      ['payment_id,net_credit,fee,status,settlement_id\npay_SAMPLE001,12500,0,captured,setl_001'],
      'razorpay_settlement_sample.csv',
      { type: 'text/csv' },
    )
    setFileA(sampleA)
    setFileB(sampleB)
  }

  function handleIngest() {
    if (ingesting) return
    setIngesting(true)
    setIngestProgress(0)

    // Simulate 1-second progress
    const steps = [15, 35, 55, 75, 90, 100]
    steps.forEach((p, i) => {
      setTimeout(() => {
        setIngestProgress(p)
        if (p === 100) {
          setTimeout(() => {
            setIngesting(false)
            setIngestProgress(0)
            setFileA(null)
            setFileB(null)
            onClose()
            onIngest()
          }, 300)
        }
      }, i * 160)
    })
  }

  function handleClose() {
    if (ingesting) return
    setFileA(null)
    setFileB(null)
    setIngestProgress(0)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-500 to-sky-400 animate-gradient">
                <Upload className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-[15px] font-semibold text-slate-800">
                Ingest Multi-Source Financial Records
              </h2>
            </div>
            <p className="mt-1.5 ml-10.5 text-[12px] text-slate-400 max-w-md">
              Upload your internal merchant ledger and the Razorpay settlement batch export to run a deterministic audit.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={ingesting}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dropzones */}
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Source A
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Internal Merchant Order Ledger
              </span>
            </div>
            <Dropzone
              id="dropzone-a"
              title="Drop merchant ledger here"
              subtitle=".csv or .json"
              icon={<Database className="h-5 w-5 text-blue-500" />}
              fields="order_id · amount · payment_method · expected_fee"
              accept=".csv,.json"
              file={fileA}
              onFile={setFileA}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Source B
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Razorpay Settlement Batch Export
              </span>
            </div>
            <Dropzone
              id="dropzone-b"
              title="Drop Razorpay export here"
              subtitle=".csv or .json"
              icon={<Landmark className="h-5 w-5 text-amber-500" />}
              fields="payment_id · net_credit · fee · status · settlement_id"
              accept=".csv,.json"
              file={fileB}
              onFile={setFileB}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-2xl">
          {ingesting && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-blue-600">
                  Ingesting batch records…
                </span>
                <span className="font-mono text-[11px] text-slate-500 tabular">
                  {ingestProgress}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 animate-gradient transition-all duration-150"
                  style={{ width: `${ingestProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="load-sample-btn"
              onClick={loadSample}
              disabled={ingesting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Load Sample Merchant Files
            </button>

            <button
              type="button"
              id="ingest-audit-btn"
              onClick={handleIngest}
              disabled={ingesting}
              className={cn(
                'ml-auto inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all',
                ingesting
                  ? 'bg-blue-400 cursor-wait'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 animate-gradient shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30',
              )}
            >
              {ingesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingesting…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Ingest &amp; Run Deterministic Audit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
