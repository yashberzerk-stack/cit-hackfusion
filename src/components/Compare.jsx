import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Scale, Trophy, XCircle } from 'lucide-react'
import { ANALYZED_POLICIES, CATEGORIES, RISK_META, clampMeter } from '../data'
import { Badge, Card, Meter, RiskChip } from './ui'

const KEYS = Object.keys(ANALYZED_POLICIES)

export default function Compare() {
  const [aKey, setAKey] = useState('photobomb.app')
  const [bKey, setBKey] = useState('cloudvault.io')

  const a = ANALYZED_POLICIES[aKey]
  const b = ANALYZED_POLICIES[bKey]

  const winner = useMemo(() => {
    if (a.riskScore === b.riskScore) return null
    return a.riskScore < b.riskScore ? 'a' : 'b'
  }, [a, b])

  const catWinner = (key) => {
    if (a.categories[key] === b.categories[key]) return null
    return a.categories[key] < b.categories[key] ? 'a' : 'b'
  }

  function Selector({ label, value, onChange }) {
    return (
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-edge bg-card px-3.5 py-2.5 text-sm font-semibold text-slate-100 outline-none transition focus:border-indigo-500/60"
          >
            {KEYS.map((k) => (
              <option key={k} value={k}>{ANALYZED_POLICIES[k].company} · {ANALYZED_POLICIES[k].domain}</option>
            ))}
          </select>
          <Scale className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="animate-fade-slide-up">
        <h2 className="text-2xl font-bold tracking-tight text-white">Service Comparison</h2>
        <p className="mt-1 text-sm text-slate-400">
          Benchmark two platforms side-by-side before you sign up for either.
        </p>
      </section>

      <section className="grid gap-3 animate-fade-slide-up sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Selector label="Service A" value={aKey} onChange={setAKey} />
        <span className="hidden justify-center pb-3 sm:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-card text-slate-400">
            <ArrowRight className="h-4 w-4" />
          </span>
        </span>
        <Selector label="Service B" value={bKey} onChange={setBKey} />
      </section>

      <section className="grid gap-3 animate-fade-slide-up lg:grid-cols-2">
        {[
          { p: a, tag: 'Service A', isWinner: winner === 'a' },
          { p: b, tag: 'Service B', isWinner: winner === 'b' },
        ].map(({ p, tag, isWinner }) => {
          return (
            <Card key={tag} className={`p-5 ${isWinner ? 'ring-1 ring-emerald-500/40' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone="indigo">{tag}</Badge>
                  <p className="truncate text-sm font-bold text-white">{p.company}</p>
                </div>
                {isWinner && (
                  <Badge tone="success">
                    <Trophy className="h-3 w-3" /> Better choice
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{p.domain} · {p.type}</p>

              <div className="mt-4 flex items-center gap-4">
                <Meter value={p.riskScore} size={110} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <RiskChip overall={p.overall} />
                    <span className="text-xs font-bold text-slate-200">{p.riskScore}/100</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {CATEGORIES.map((c) => {
                      const val = p.categories[c.key]
                      const { color } = clampMeter(val)
                      return (
                        <div key={c.key} className="flex items-center gap-2">
                          <span className="w-24 shrink-0 truncate text-[10px] font-medium text-slate-500">{c.label}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700/50">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: color }} />
                          </div>
                          <span className="w-6 text-right text-[10px] font-bold tabular-nums text-slate-300">{val}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <p className="mt-4 rounded-lg bg-card-soft px-3 py-2 text-[11px] leading-relaxed text-slate-400">{p.recommendation}</p>
            </Card>
          )
        })}
      </section>

      <section className="animate-fade-slide-up">
        <h3 className="mb-3 text-sm font-bold text-slate-200">Category winners</h3>
        <Card className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-edge bg-card-soft/60 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3 font-bold">Dimension</th>
                <th className="px-4 py-3 text-center font-bold text-indigo-300">{a.company}</th>
                <th className="px-4 py-3 text-center font-bold text-cyan-300">{b.company}</th>
                <th className="hidden px-4 py-3 text-center font-bold sm:table-cell">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge/60">
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                const av = a.categories[c.key]
                const bv = b.categories[c.key]
                const w = catWinner(c.key)
                return (
                  <tr key={c.key}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-bold text-slate-200">
                        <Icon className="h-3.5 w-3.5 text-slate-400" /> {c.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold tabular-nums text-slate-200">{av}</span>
                      {w === 'a' && <CheckCircle2 className="mx-auto mt-1 h-3.5 w-3.5 text-emerald-400" />}
                      {w === 'b' && <XCircle className="mx-auto mt-1 h-3.5 w-3.5 text-red-400/60" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold tabular-nums text-slate-200">{bv}</span>
                      {w === 'b' && <CheckCircle2 className="mx-auto mt-1 h-3.5 w-3.5 text-emerald-400" />}
                      {w === 'a' && <XCircle className="mx-auto mt-1 h-3.5 w-3.5 text-red-400/60" />}
                    </td>
                    <td className="hidden px-4 py-3 text-center sm:table-cell">
                      {w ? (
                        <Badge tone="success">{w === 'a' ? a.company : b.company} lower risk</Badge>
                      ) : (
                        <Badge tone="neutral">Tie</Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t border-edge bg-card-soft/40">
                <td className="px-4 py-3 font-bold text-slate-100">Overall risk</td>
                <td className="px-4 py-3 text-center font-bold tabular-nums" style={{ color: RISK_META[a.overall].color }}>
                  {a.riskScore}
                </td>
                <td className="px-4 py-3 text-center font-bold tabular-nums" style={{ color: RISK_META[b.overall].color }}>
                  {b.riskScore}
                </td>
                <td className="hidden px-4 py-3 text-center sm:table-cell">
                  {winner ? (
                    <Badge tone="success">{winner === 'a' ? a.company : b.company} wins</Badge>
                  ) : (
                    <Badge tone="neutral">Equal</Badge>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </section>

      <section className="animate-fade-slide-up">
        <Card className="flex items-start gap-3 border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40">
            <Scale className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-100">Side-by-side, not fly-by-night</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Pick any two analyzed services and ClauseGuard benchmarks them across all four risk dimensions —
              so “better” means measurably better on paper, not just nicer branding.
            </p>
          </div>
        </Card>
      </section>
    </div>
  )
}
