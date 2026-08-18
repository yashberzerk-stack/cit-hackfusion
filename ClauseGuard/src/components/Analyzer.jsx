import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Download,
  FileSearch,
  FileText,
  Languages,
  Link2,
  Loader2,
  ScanSearch,
  Wand2,
} from 'lucide-react'
import { ANALYZED_POLICIES, CATEGORIES, PIPELINE, RISK_META, SEVERITY_STYLE } from '../data'
import { analyzePolicyText } from '../lib/ruleAnalyzer'
import { Badge, Card, Meter, Ring, RiskChip } from './ui'

const SCAN_DURATION = 4800

const GENERIC_HIDDEN = [
  {
    type: 'arbitration',
    severity: 'warn',
    quote: 'Any dispute arising from these terms will be resolved by binding arbitration.',
    plain: 'You give up your right to sue in court; a private arbitrator decides.',
    whyCare: 'Arbitration clauses are one of the most common hidden traps in consumer contracts.',
  },
  {
    type: 'unilateral',
    severity: 'warn',
    quote: 'We may revise these terms at any time with or without prior notice.',
    plain: 'The contract can change without warning you first.',
    whyCare: 'Silent changes mean you may be bound by terms you never saw.',
  },
  {
    type: 'retention',
    severity: 'info',
    quote: 'Deleted data may persist in backups for a commercially reasonable period.',
    plain: 'Your deleted data can linger in backups for an unspecified time.',
    whyCare: 'Vague retention windows make true deletion unverifiable.',
  },
]

const GENERIC_CLAUSES = [
  { category: 'privacy', title: 'Data collection', severity: 'medium', raw: 'We collect account details, device information, and usage statistics.', plain: 'Standard account, device, and usage data is collected.' },
  { category: 'dataSharing', title: 'Third parties', severity: 'medium', raw: 'Personal data may be shared with service providers and partners.', plain: 'Your data reaches third-party providers and partners.' },
  { category: 'ownership', title: 'User content', severity: 'low', raw: 'You retain ownership of content you submit to the service.', plain: 'You keep ownership of your own content.' },
  { category: 'control', title: 'Termination', severity: 'medium', raw: 'We may terminate your account at our discretion with notice.', plain: 'The service can terminate your account at its discretion.' },
]

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function buildGeneric(input, docType) {
  const h = hashCode(input)
  const overall = h % 3 === 0 ? 'high' : h % 3 === 1 ? 'moderate' : 'low'
  const riskScore = overall === 'low' ? 18 + (h % 22) : overall === 'moderate' ? 45 + (h % 18) : 68 + (h % 18)
  const variance = (n) => Math.min(95, Math.max(8, n + ((h >> (n % 4)) % 21) - 10))
  return {
    domain: input.trim().split('/')[0] || 'unknown.source',
    company: 'Untitled policy',
    type: docType,
    overall,
    riskScore,
    sentences: 130 + (h % 220),
    pages: Math.round((130 + (h % 220)) / 14),
    readTime: '15 min',
    categories: {
      privacy: variance(riskScore),
      dataSharing: variance(riskScore - 6),
      ownership: variance(riskScore - 12),
      control: variance(riskScore + 4),
    },
    hiddenClauses: GENERIC_HIDDEN,
    clauses: GENERIC_CLAUSES,
    recommendation:
      overall === 'low'
        ? 'Low-risk policy. Reasonable protections for a consumer service.'
        : overall === 'moderate'
          ? 'Moderate risk. Read the flagged clauses before accepting.'
          : 'High risk. Consider a privacy-friendly alternative before signing up.',
  }
}

const BANNER = {
  high: { from: 'from-red-500/25', to: 'to-rose-500/10', border: 'border-red-500/30' },
  moderate: { from: 'from-amber-500/25', to: 'to-orange-500/10', border: 'border-amber-500/30' },
  low: { from: 'from-emerald-500/25', to: 'to-teal-500/10', border: 'border-emerald-500/30' },
}

export default function Analyzer({ onDone, initialInput = null, autoRun = false }) {
  const [mode, setMode] = useState('link')
  const [docType, setDocType] = useState('Terms & Privacy')
  const [link, setLink] = useState('')
  const [text, setText] = useState('')
  const [state, setState] = useState('idle')
  const [stageIdx, setStageIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach((t) => t.clear?.() || clearTimeout(t)), [])

  function startScan() {
    const input = mode === 'link' ? link.trim() : text.trim()
    if (!input) {
      setError(mode === 'link' ? 'Paste a policy URL to analyze.' : 'Paste some policy text to analyze.')
      return
    }
    setError('')
    setResult(null)
    setState('scanning')
    setStageIdx(0)
    setProgress(0)

    const stepMs = SCAN_DURATION / PIPELINE.length
    PIPELINE.forEach((_, i) => {
      timers.current.push(setTimeout(() => setStageIdx(i), i * stepMs + stepMs / 2))
    })

    const start = Date.now()
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / SCAN_DURATION) * 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(tick)
        setState('done')
        setStageIdx(PIPELINE.length)
        const key = input.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase()
        let res = ANALYZED_POLICIES[key] || buildGeneric(input, docType)
        if (mode === 'text') {
          // run local rule-based analyzer for pasted text
          try {
            res = analyzePolicyText(text || input, key || 'pasted.policy')
          } catch (e) {
            res = buildGeneric(input, docType)
          }
        }
        setResult(res)
        onDone?.(res)
      }
    }, 40)
    timers.current.push({ clear: () => clearInterval(tick) })
  }

  // If an initial input was provided (via URL or extension), prefill and optionally auto-run
  useEffect(() => {
    if (!initialInput) return
    const inp = initialInput.includes('http') ? initialInput : `https://${initialInput.replace(/^https?:\/\//, '')}/terms`
    setMode('link')
    setLink(inp)
    if (autoRun) {
      // small delay to allow UI to update
      timers.current.push(setTimeout(() => startScan(), 400))
    }
  }, [initialInput, autoRun])

  const scanning = state === 'scanning'

  return (
    <div className="space-y-5">
      <section className="animate-fade-slide-up">
        <h2 className="text-2xl font-bold tracking-tight text-white">Risk Analyzer</h2>
        <p className="mt-1 text-sm text-slate-400">
          Ingest any T&C or privacy policy and get a structured risk profile in under a minute.
        </p>
      </section>

      {state === 'idle' && (
        <section className="space-y-4 animate-fade-slide-up">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'link', label: 'Paste a link', icon: Link2 },
                { id: 'text', label: 'Paste the text', icon: ClipboardPaste },
              ].map((t) => {
                const active = mode === t.id
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => setMode(t.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                        : 'border-edge bg-card-soft text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-4">
              {mode === 'link' ? (
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startScan()}
                    placeholder="https://example.com/terms"
                    className="w-full rounded-xl border border-edge bg-card-soft py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ) : (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  placeholder="Paste the terms & conditions or privacy policy text here…"
                  className="w-full resize-none rounded-xl border border-edge bg-card-soft p-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                />
              )}
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Document type</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {['Terms', 'Privacy', 'App permissions'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDocType(t)}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                      docType === t
                        ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                        : 'border-edge bg-card-soft text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" /> {error}
              </p>
            )}

            <button
              onClick={startScan}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 active:scale-[0.98]"
            >
              <ScanSearch className="h-4.5 w-4.5" size={18} />
              Run risk analysis
            </button>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Try a sample:</span>
            {['photobomb.app', 'cloudvault.io', 'fitpulse.co'].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setMode('link')
                  setLink(`https://${d}/terms`)
                }}
                className="rounded-full border border-edge bg-card px-3 py-1 text-[11px] font-semibold text-indigo-300 transition hover:border-indigo-500/40 hover:bg-card-soft"
              >
                {d}
              </button>
            ))}
          </div>
        </section>
      )}

      {scanning && (
        <section className="animate-fade-slide-up">
          <Card className="overflow-hidden">
            <div className="relative h-44 bg-card-soft">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="flex h-20 w-16 items-center justify-center rounded-lg border border-edge bg-card text-slate-500">
                    <FileText className="h-7 w-7" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white">
                    <Wand2 className="h-3 w-3" />
                  </span>
                </div>
              </div>
              <div className="animate-scan-sweep absolute inset-x-6 h-0.5 rounded-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
            </div>

            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-100">Running NLP pipeline…</p>
                <span className="text-sm font-bold tabular-nums text-indigo-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ul className="space-y-2 pt-1">
                {PIPELINE.map((s, i) => {
                  const done = i < stageIdx
                  const current = i === stageIdx
                  return (
                    <li key={s.id} className="flex items-center gap-2.5 text-xs">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : current ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-400" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border border-slate-600" />
                      )}
                      <span className={done ? 'text-slate-400' : current ? 'font-semibold text-indigo-300' : 'text-slate-600'}>
                        {s.label}
                      </span>
                      {done && <span className="ml-auto text-[10px] font-medium text-emerald-400">done</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          </Card>
        </section>
      )}

      {state === 'done' && result && <Results result={result} onRescan={() => setState('idle')} />}

      {state === 'idle' && (
        <Card className="flex items-start gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40">
            <Languages className="h-4.5 w-4.5" size={18} />
          </span>
          <p className="text-xs leading-relaxed text-slate-400">
            <span className="font-bold text-slate-200">How it works:</span> documents are chunked, classified into 4 risk
            categories (privacy, data sharing, content ownership, account control), scored for severity, and rewritten in
            plain English — with a <span className="text-indigo-300">“Why you should care”</span> explanation for every
            hidden clause.
          </p>
        </Card>
      )}
    </div>
  )
}

function Results({ result, onRescan }) {
  const risk = RISK_META[result.overall]
  const banner = BANNER[result.overall]
  const [saved, setSaved] = useState(false)

  return (
    <section className="space-y-4 animate-fade-slide-up">
      <div className={`relative overflow-hidden rounded-2xl border ${banner.border} bg-gradient-to-br ${banner.from} ${banner.to} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <RiskChip overall={result.overall} />
              <span className="text-[11px] font-semibold text-slate-400">{result.type}</span>
            </div>
            <h3 className="mt-2 truncate text-xl font-bold text-white">{result.domain}</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {result.company} · {result.pages} pages · {result.sentences} sentences · ~{result.readTime} to read
            </p>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-300">{result.recommendation}</p>
          </div>
          <Ring value={result.riskScore} size={84} stroke={8} color={risk.ring}>
            <div className="text-center">
              <p className="text-lg font-bold leading-none text-white">{result.riskScore}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">risk</p>
            </div>
          </Ring>
        </div>
      </div>

      <Card className="p-5">
        <h4 className="text-sm font-bold text-slate-100">Category risk profile</h4>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon
            const val = result.categories[c.key]
            return (
              <div key={c.key} className="flex flex-col items-center text-center">
                <Meter value={val} size={128} />
                <span className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Icon className="h-3.5 w-3.5 text-indigo-400" /> {c.label}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {result.hiddenClauses.length > 0 && (
        <Card className="p-5">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <AlertTriangle className="h-4 w-4 text-red-400" /> Hidden Clause Finder
            <Badge tone="danger" className="ml-auto">{result.hiddenClauses.length} found</Badge>
          </h4>
          <div className="mt-4 space-y-3">
            {result.hiddenClauses.map((f, i) => {
              const style = SEVERITY_STYLE[f.severity]
              const FIcon = style.icon
              return (
                <div key={i} className={`rounded-xl border ${style.box} p-4`}>
                  <div className="flex items-center gap-1.5">
                    <FIcon className={`h-3.5 w-3.5 ${style.chip}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${style.chip}`}>{style.label}</span>
                  </div>
                  <blockquote className="mt-2 border-l-2 border-slate-600 pl-3 text-xs italic leading-relaxed text-slate-300">
                    “{f.quote}”
                  </blockquote>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    <span className="font-bold text-emerald-300">Plain English: </span>{f.plain}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    <span className="font-bold text-amber-300">Why you should care: </span>{f.whyCare}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-100">
          <Languages className="h-4 w-4 text-cyan-400" /> Plain English Translator
        </h4>
        <div className="mt-4 space-y-4">
          {result.clauses.map((c, i) => (
            <div key={i} className="rounded-xl border border-edge overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-edge bg-card-soft px-4 py-2.5">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <FileSearch className="h-3.5 w-3.5 text-indigo-400" /> {c.title}
                </span>
                <Badge tone={c.severity === 'high' ? 'danger' : c.severity === 'medium' ? 'warn' : 'success'}>
                  {c.severity === 'high' ? 'High risk' : c.severity === 'medium' ? 'Medium risk' : 'Low risk'}
                </Badge>
              </div>
              <div className="grid divide-y divide-edge sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Original legalese</p>
                  <p className="mt-2 text-xs italic leading-relaxed text-slate-400">“{c.raw}”</p>
                </div>
                <div className="bg-emerald-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Human translation</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200">{c.plain}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        {saved ? (
          <button
            onClick={onRescan}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4.5 w-4.5" size={18} /> Saved to history
          </button>
        ) : (
          <button
            onClick={() => setSaved(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.98]"
          >
            <Check className="h-4.5 w-4.5" size={18} /> Save to my history
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={onRescan}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-edge bg-card py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-card-soft active:scale-[0.98]"
          >
            Analyze another
          </button>
          <button
            onClick={() => exportReport(result)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-edge bg-card py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-card-soft active:scale-[0.98]"
          >
            <Download className="h-4 w-4" /> Export report
          </button>
        </div>
      </div>
    </section>
  )
}

function exportReport(result) {
  try {
    const payload = {
      meta: {
        domain: result.domain,
        company: result.company,
        type: result.type,
        overall: result.overall,
        riskScore: result.riskScore,
        pages: result.pages,
        sentences: result.sentences,
        readTime: result.readTime,
        generatedAt: new Date().toISOString(),
      },
      categories: result.categories,
      hiddenClauses: result.hiddenClauses,
      clauses: result.clauses,
      recommendation: result.recommendation,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.domain.replace(/[^a-z0-9.-]/gi, '_')}-clauseguard-report.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    // noop
  }
}
