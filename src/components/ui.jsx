import { Check, ChevronRight } from 'lucide-react'
import { clampMeter as meterColor } from '../data'

export function Meter({ value, size = 132, label }) {
  const r = 50
  const half = Math.PI * r
  const v = Math.min(Math.max(value, 0), 100)
  const dash = (v / 100) * half
  const offset = half - dash
  const { color } = meterColor(v)
  const w = 120
  const h = 70

  return (
    <div className="relative inline-block" style={{ width: size, height: size * (h / w) }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={size} height={size * (h / w)}>
        <path
          d={`M 10 ${h - 8} A ${r} ${r} 0 0 1 ${w - 10} ${h - 8}`}
          fill="none"
          stroke="#1f2b45"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          className="meter-anim"
          d={`M 10 ${h - 8} A ${r} ${r} 0 0 1 ${w - 10} ${h - 8}`}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={half}
          strokeDashoffset={offset}
          style={{ '--meter-max': half, transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-x-0 top-[14%] flex flex-col items-center">
        <span className="text-xl font-bold leading-none text-white tabular-nums">{v}</span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>
          {label ?? meterColor(v).label}
        </span>
      </div>
    </div>
  )
}

export function Ring({ value, size = 92, stroke = 9, color, track = '#1f2b45', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.min(Math.max(value, 0), 100)
  const off = c - (v / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

export function Badge({ tone = 'info', children, className = '' }) {
  const tones = {
    info: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    warn: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-300 border-red-500/30',
    neutral: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function Card({ children, className = '', onClick }) {
  const base = 'rounded-2xl border border-edge bg-card shadow-lg shadow-black/20'
  if (onClick) {
    return (
      <button onClick={onClick} className={`${base} ${className} text-left transition hover:border-indigo-500/40 hover:bg-card-soft active:scale-[0.99]`}>
        {children}
      </button>
    )
  }
  return <div className={`${base} ${className}`}>{children}</div>
}

export function Toggle({ checked, onChange, label, desc, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-edge bg-card-soft text-indigo-400">
            <Icon size={18} />
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-100">{label}</p>
          {desc && <p className="mt-0.5 text-xs text-slate-400">{desc}</p>}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-indigo-500' : 'bg-slate-700'}`}
      >
        <span
          className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white transition-all duration-200 ${checked ? 'left-6' : 'left-1'}`}
        >
          {checked && <Check className="h-3 w-3 text-indigo-600" strokeWidth={3} />}
        </span>
      </button>
    </div>
  )
}

export function ListLink({ icon: Icon, title, desc, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-card-soft active:bg-card-soft"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-indigo-300 ring-1 ring-indigo-500/30">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-100">{title}</span>
          {badge}
        </span>
        <span className="block truncate text-xs text-slate-400">{desc}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
    </button>
  )
}

export function RiskChip({ overall }) {
  const meta = {
    low: { label: 'Low risk', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
    moderate: { label: 'Moderate risk', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    high: { label: 'High risk', cls: 'bg-red-500/10 text-red-300 border-red-500/30' },
  }[overall]
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${meta.cls}`}>{meta.label}</span>
}
