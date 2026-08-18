import { useMemo, useState } from 'react'
import {
  ArrowDownUp,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Filter,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { HISTORY, RISK_META } from '../data'
import { Badge, Card, RiskChip } from './ui'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'low', label: 'Low risk' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'high', label: 'High risk' },
]

const SORTS = ['Newest', 'Oldest', 'Lowest risk', 'Highest risk']

export default function History({ items = HISTORY }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('Newest')
  const [openId, setOpenId] = useState(null)

  const list = useMemo(() => {
    let out = items.filter((h) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.domain.toLowerCase().includes(q) ||
        (h.tags && h.tags.some((t) => t.toLowerCase().includes(q)))
      const matchesFilter = filter === 'all' || h.overall === filter
      return matchesQuery && matchesFilter
    })
    if (sort === 'Newest') out = [...out]
    if (sort === 'Oldest') out = [...out].reverse()
    if (sort === 'Lowest risk') out = [...out].sort((a, b) => a.riskScore - b.riskScore)
    if (sort === 'Highest risk') out = [...out].sort((a, b) => b.riskScore - a.riskScore)
    return out
  }, [query, filter, sort, items])

  const counts = useMemo(
    () => ({
      all: items.length,
      low: items.filter((h) => h.overall === 'low').length,
      moderate: items.filter((h) => h.overall === 'moderate').length,
      high: items.filter((h) => h.overall === 'high').length,
    }),
    [items],
  )

  return (
    <div className="space-y-5">
      <section className="animate-fade-slide-up">
        <h2 className="text-2xl font-bold tracking-tight text-white">Analytics & History</h2>
        <p className="mt-1 text-sm text-slate-400">Every analysis, verdict, and hidden clause — searchable.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 animate-fade-slide-up lg:grid-cols-4">
        {[
          { label: 'Total analyses', value: counts.all, tone: 'text-indigo-400', icon: BarChart3 },
          { label: 'Low risk', value: counts.low, tone: 'text-emerald-400', icon: ShieldAlert },
          { label: 'Moderate', value: counts.moderate, tone: 'text-amber-400', icon: Filter },
          { label: 'High risk', value: counts.high, tone: 'text-red-400', icon: X },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <Card key={i} className="p-4">
              <Icon className={`h-4.5 w-4.5 ${s.tone}`} size={18} />
              <p className="mt-2 text-xl font-bold tabular-nums text-white">{s.value}</p>
              <p className="text-[11px] font-medium text-slate-400">{s.label}</p>
            </Card>
          )
        })}
      </section>

      <section className="space-y-3 animate-fade-slide-up">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by service, domain, or tag…"
            className="w-full rounded-xl border border-edge bg-card py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === f.id
                  ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                  : 'border-edge bg-card text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label} <span className="ml-1 text-[10px] opacity-60">{counts[f.id]}</span>
            </button>
          ))}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Sort</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none rounded-xl border border-edge bg-card py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-200 outline-none transition focus:border-indigo-500/60"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ArrowDownUp className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 animate-fade-slide-up">
        {list.length === 0 && (
          <Card className="p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-300">No analyses match your filters</p>
            <p className="mt-1 text-xs text-slate-500">Try a different search term or clear the filters.</p>
          </Card>
        )}
        {list.map((h) => {
          const meta = RISK_META[h.overall]
          const open = openId === h.id
          return (
            <Card key={h.id} className="overflow-hidden">
              <button onClick={() => setOpenId(open ? null : h.id)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.chip}`}>
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-100">{h.name}</p>
                    <RiskChip overall={h.overall} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="truncate">{h.domain}</span>
                    <span>·</span>
                    <span>{h.type}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <CalendarDays className="h-3 w-3" /> {h.date}
                  </span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: meta.color }}>{h.riskScore}/100</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {open && (
                <div className="border-t border-edge/60 bg-card-soft/50 px-4 py-3 animate-fade-slide-up">
                  <div className="flex flex-wrap gap-1.5">
                    {h.tags?.map((t) => (
                      <Badge key={t} tone="indigo">{t}</Badge>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {[
                      { k: 'Risk level', v: meta.label },
                      { k: 'Legalese density', v: h.riskScore >= 70 ? 'Extreme' : h.riskScore >= 40 ? 'Heavy' : 'Moderate' },
                      { k: 'Recommended', v: h.overall === 'low' ? 'Safe to accept' : h.overall === 'moderate' ? 'Read first' : 'Reconsider' },
                    ].map((x) => (
                      <div key={x.k} className="rounded-lg border border-edge bg-card px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{x.k}</p>
                        <p className="mt-0.5 text-xs font-bold text-slate-200">{x.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </section>
    </div>
  )
}
