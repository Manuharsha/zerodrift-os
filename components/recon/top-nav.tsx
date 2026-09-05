'use client'

import { cn } from '@/lib/utils'
import { Download, ShieldCheck, Layers, Upload, ChevronDown } from 'lucide-react'
import type { BatchProfileId } from '@/lib/batch-profiles'
import { useState } from 'react'

const PROFILES: { id: BatchProfileId; label: string; sub: string; tag: string }[] = [
  {
    id: 'standard',
    label: 'Standard Batch',
    sub: '55 Records · Default',
    tag: '76.36% match · ₹2,418.50 leakage',
  },
  {
    id: 'diwali',
    label: 'Diwali Flash Sale Surge',
    sub: '75 Records · Chaos Load',
    tag: '~62% match · ₹6,850 leakage',
  },
  {
    id: 'clean',
    label: 'Clean Settlement Run',
    sub: '40 Records · High Integrity',
    tag: '97.5% match · 1 float only',
  },
]

export function TopNav({
  zeroDrift,
  onToggleZeroDrift,
  onExport,
  exportDisabled,
  onUpload,
  selectedProfile,
  onSelectProfile,
}: {
  zeroDrift: boolean
  onToggleZeroDrift: () => void
  onExport: () => void
  exportDisabled: boolean
  onUpload: () => void
  selectedProfile: BatchProfileId
  onSelectProfile: (id: BatchProfileId) => void
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const current = PROFILES.find((p) => p.id === selectedProfile) ?? PROFILES[0]

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        {/* Left: brand */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-500 to-sky-400 animate-gradient shadow-sm shadow-blue-500/30">
            <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[14px] font-semibold text-slate-800">
              ZeroDrift OS
              <span className="ml-1.5 text-slate-400 font-normal text-[13px]">
                · Enterprise Finance Controller
              </span>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            Razorpay Partner Node
          </span>
        </div>

        {/* Center: interactive batch profile selector */}
        <div className="relative hidden md:block">
          <button
            type="button"
            id="batch-profile-selector"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/30"
          >
            <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-slate-700 leading-tight">
                {current.label}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {current.sub} · {current.tag}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-slate-400 transition-transform shrink-0',
                profileOpen && 'rotate-180',
              )}
            />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-1.5 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/80">
                <div className="border-b border-slate-100 px-3 py-2">
                  <div className="text-[11px] font-medium text-slate-400">
                    Select operational batch profile
                  </div>
                </div>
                {PROFILES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProfile(p.id)
                      setProfileOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50',
                      p.id === selectedProfile && 'bg-blue-50/50',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                        p.id === 'standard'
                          ? 'bg-blue-500'
                          : p.id === 'diwali'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500',
                      )}
                    />
                    <div>
                      <div className="text-[12px] font-semibold text-slate-700">
                        {p.label}
                        <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                          {p.sub}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                        {p.tag}
                      </div>
                    </div>
                    {p.id === selectedProfile && (
                      <span className="ml-auto shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {/* Zero-drift toggle */}
          <button
            type="button"
            onClick={onToggleZeroDrift}
            className={cn(
              'group hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:flex',
              zeroDrift
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
            )}
            aria-pressed={zeroDrift}
          >
            <span
              className={cn(
                'relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors',
                zeroDrift ? 'bg-emerald-300' : 'bg-slate-200',
              )}
            >
              <span
                className={cn(
                  'absolute h-2.5 w-2.5 rounded-full transition-all',
                  zeroDrift ? 'left-[13px] bg-emerald-600' : 'left-0.5 bg-slate-400',
                )}
              />
            </span>
            Zero-drift mode
          </button>

          {/* Upload Custom Batch */}
          <button
            type="button"
            id="upload-batch-btn"
            onClick={onUpload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Upload Custom Batch</span>
          </button>

          {/* Export */}
          <button
            type="button"
            id="export-audit-btn"
            onClick={onExport}
            disabled={exportDisabled}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all',
              exportDisabled
                ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300',
            )}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export Audit Packet</span>
          </button>
        </div>
      </div>
    </header>
  )
}
