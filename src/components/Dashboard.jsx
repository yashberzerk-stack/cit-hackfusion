import { useState } from 'react'
import { ArrowUpRight, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react'
import { ANALYZED_POLICIES, CATEGORIES, DASH_STATS, QUICK_ACTIONS, RECENT, RISK_META, clampMeter } from '../data'
import { Badge, Card, Meter, Ring, RiskChip } from './ui'

const TONE_ICON = {
  info: 'text-sky-400',
  danger: 'text-red-400',
  success: 'text-emerald-400',
  warn: 'text-amber-400',
}

const GRADS = {
  primary: 'from-indigo-500 to-cyan-500',
  indigo: 'from-violet-500 to-indigo-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
}

export default function Dashboard({ onNavigate }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const [profileKey, setProfileKey] = useState('photobomb.app')
  const profile = ANALYZED_POLICIES[profileKey]
  const risk = RISK_META[profile.overall]

  return (
    <div className="space-y-6">
      <section className="animate-fade-slide-up">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400/80">{today}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">{greeting}, Alex 👋</h2>
        <p className="mt-1 text-sm text-slate-400">
          ClauseGuard turns 30 pages of legalese into an honest risk score.
        </p>
      </section>

      <section className="animate-fade-slide-up">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-card to-cyan-500/15 p-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-500/40">
                <Sparkles className="h-4 w-4 text-indigo-300" />
              </span>
              <Badge tone="indigo">New</Badge>
            </div>
            <h3 className="mt-3 text-lg font-bold text-white">Hidden Clause Finder</h3>
            <p className="mt-1 max-w-md text-sm text-slate-400">
              Auto-renewals, forced arbitration, post-deletion retention — surfaced the moment they appear in a contract.
            </p>
            <button
              onClick={() => onNavigate('analyze')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 active:scale-95"
            >
              Analyze a policy <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="animate-fade-slide-up">
        <h3 className="mb-3 text-sm font-bold text-slate-200">Quick actions</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((q) => {
            const Icon = q.icon
            return (
              <Card key={q.id} onClick={() => onNavigate(q.tab)} className="p-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${GRADS[q.tone]} text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-100">{q.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{q.desc}</p>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="animate-fade-slide-up">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-200">User risk profile</h3>
            <p className="text-[11px] text-slate-500">Switch a service to preview its risk profile</p>
          </div>
        </div>
        <Card className="p-5">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(ANALYZED_POLICIES).map((k) => (
              <button
                key={k}
                onClick={() => setProfileKey(k)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  profileKey === k
                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                    : 'border-edge bg-card-soft text-slate-400 hover:text-slate-200'
                }`}
              >
                {ANALYZED_POLICIES[k].company}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex flex-col items-center">
              <Ring value={profile.riskScore} size={120} stroke={11} color={risk.ring}>
                <div className="text-center">
                  <p className="text-2xl font-bold leading-none text-white tabular-nums">{profile.riskScore}</p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">risk score</p>
                </div>
              </Ring>
              <div className="mt-3 flex items-center gap-2">
                <RiskChip overall={profile.overall} />
                <span className="text-[11px] text-slate-500">{profile.company}</span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                const val = profile.categories[c.key]
                const { color } = clampMeter(val)
                return (
                  <div key={c.key} className="flex flex-col items-center text-center">
                    <Meter value={val} size={128} />
                    <span className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <Icon className="h-3.5 w-3.5" style={{ color }} /> {c.label}
                    </span>
                    <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{c.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </section>

      <section className="animate-fade-slide-up">
        <h3 className="mb-3 text-sm font-bold text-slate-200">Overview</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {DASH_STATS.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.id} className="p-4">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${TONE_ICON[s.tone]}`} />
                  <TrendingUp className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-white">{s.value}</p>
                <p className="text-xs font-medium text-slate-400">{s.label}</p>
                <p className="mt-1 text-[11px] text-slate-500">{s.delta}</p>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="animate-fade-slide-up">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">Recent analyses</h3>
          <button onClick={() => onNavigate('history')} className="text-xs font-semibold text-indigo-400 transition hover:text-indigo-300">
            View all →
          </button>
        </div>
        <div className="space-y-3">
          {RECENT.map((r) => {
            const meta = RISK_META[r.overall]
            return (
              <Card key={r.id} onClick={() => onNavigate('history')} className="flex items-center gap-4 p-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.chip}`}>
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-100">{r.name}</p>
                    <RiskChip overall={r.overall} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">{r.domain} · {r.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums" style={{ color: meta.color }}>{r.riskScore}</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500">risk</p>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
