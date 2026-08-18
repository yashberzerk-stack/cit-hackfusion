import { useState } from 'react'
import {
  Bell,
  Braces,
  Check,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Languages,
  Link2,
  LogOut,
  Mail,
  RefreshCw,
  Scale,
  Sparkles,
  User,
  Wand2,
} from 'lucide-react'
import { Card, ListLink, Toggle } from './ui'

function SectionTitle({ children }) {
  return <h3 className="mb-3 mt-6 text-sm font-bold text-slate-200 first:mt-0">{children}</h3>
}

export default function Settings() {
  const [prefs, setPrefs] = useState({
    hiddenClauses: true,
    plainEnglish: true,
    zeroShot: true,
    riskAlerts: true,
    autoScan: true,
    extensionActive: true,
    emailDigest: false,
  })
  const [llmKey, setLlmKey] = useState('llm_sk_9f3a81d2c2b19e47a05f')
  const [showKey, setShowKey] = useState(false)
  const [keyState, setKeyState] = useState('idle')
  const [toast, setToast] = useState('')

  function setPref(k) {
    setPrefs((p) => ({ ...p, [k]: !p[k] }))
  }

  function testKey() {
    setKeyState('testing')
    setTimeout(() => {
      setKeyState('ok')
      setTimeout(() => setKeyState('idle'), 2500)
    }, 1200)
  }

  function save() {
    setToast('Settings saved')
    setTimeout(() => setToast(''), 2200)
  }

  const keyBtn = {
    idle: { label: 'Test model', cls: 'bg-card text-slate-300 hover:bg-card-soft' },
    testing: { label: 'Testing…', cls: 'bg-card text-indigo-400' },
    ok: { label: 'Connected', cls: 'bg-emerald-500/15 text-emerald-300' },
  }[keyState]

  return (
    <div className="space-y-5">
      <section className="animate-fade-slide-up">
        <h2 className="text-2xl font-bold tracking-tight text-white">Settings</h2>
        <p className="mt-1 text-sm text-slate-400">Configure the NLP engine, alerts, and the browser extension.</p>
      </section>

      <section className="animate-fade-slide-up">
        <Card className="flex items-center gap-4 p-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/25">
            AR
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">Alex Rivera</p>
            <p className="truncate text-xs text-slate-400">alex@example.com</p>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              <Sparkles className="h-3 w-3" /> Student plan · Unlimited analyses
            </span>
          </div>
          <button
            onClick={() => {}}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-card text-slate-400 transition hover:text-white"
          >
            <User className="h-4 w-4" />
          </button>
        </Card>
      </section>

      <section className="animate-fade-slide-up">
        <SectionTitle>Analysis engine</SectionTitle>
        <Card className="space-y-4 p-4">
          <Toggle
            icon={Wand2}
            label="Hidden Clause Finder"
            desc="Detect auto-renewals, arbitration, retention, and data-sale traps."
            checked={prefs.hiddenClauses}
            onChange={() => setPref('hiddenClauses')}
          />
          <div className="h-px bg-edge/60" />
          <Toggle
            icon={Languages}
            label="Plain English translator"
            desc="Render every flagged clause in human-readable language."
            checked={prefs.plainEnglish}
            onChange={() => setPref('plainEnglish')}
          />
          <div className="h-px bg-edge/60" />
          <Toggle
            icon={Braces}
            label="Zero-shot clause extraction"
            desc="Use the 8B local model instead of the hosted GPT fallback."
            checked={prefs.zeroShot}
            onChange={() => setPref('zeroShot')}
          />
        </Card>
      </section>

      <section className="animate-fade-slide-up">
        <SectionTitle>Alerts & notifications</SectionTitle>
        <Card className="space-y-4 p-4">
          <Toggle
            icon={Bell}
            label="Risk alerts"
            desc="Push a notification when a scan flags critical clauses."
            checked={prefs.riskAlerts}
            onChange={() => setPref('riskAlerts')}
          />
          <div className="h-px bg-edge/60" />
          <Toggle
            icon={Link2}
            label="Auto-scan on visit"
            desc="Automatically analyze any policy page you open."
            checked={prefs.autoScan}
            onChange={() => setPref('autoScan')}
          />
          <div className="h-px bg-edge/60" />
          <Toggle
            icon={Mail}
            label="Weekly digest"
            desc="Email a plain-language summary of new analyses."
            checked={prefs.emailDigest}
            onChange={() => setPref('emailDigest')}
          />
        </Card>
      </section>

      <section className="animate-fade-slide-up">
        <SectionTitle>Browser extension</SectionTitle>
        <Card className="p-4">
          <Toggle
            icon={Download}
            label="Extension active"
            desc="Real-time overlay on checkout and sign-up pages."
            checked={prefs.extensionActive}
            onChange={() => setPref('extensionActive')}
          />
          <p className="mt-3 rounded-lg bg-card-soft px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            Prototype lives in <code className="text-indigo-300">extension/</code> — load the folder via{" "}
            <span className="font-semibold text-slate-300">chrome://extensions → Load unpacked</span>.
          </p>
        </Card>
      </section>

      <section className="animate-fade-slide-up">
        <SectionTitle>Model API key</SectionTitle>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
              <Braces className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100">Llama-3 8B / GPT-4o mini</p>
              <p className="text-[11px] text-slate-500">Used for clause classification & plain-English rewriting.</p>
            </div>
          </div>
          <div className="relative mt-3">
            <input
              value={llmKey}
              onChange={(e) => setLlmKey(e.target.value)}
              type={showKey ? 'text' : 'password'}
              placeholder="llm_sk_…"
              className="w-full rounded-xl border border-edge bg-card-soft py-3 pl-4 pr-20 font-mono text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={testKey}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition active:scale-95 ${keyBtn.cls} ${
                keyState === 'testing' ? 'cursor-wait' : ''
              }`}
            >
              {keyState === 'testing' ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : keyState === 'ok' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Braces className="h-3.5 w-3.5" />
              )}
              {keyBtn.label}
            </button>
            {keyState === 'ok' && <span className="text-[11px] font-medium text-emerald-400">Model responded in 1.2s</span>}
          </div>
        </Card>
      </section>

      <section className="animate-fade-slide-up">
        <SectionTitle>Account</SectionTitle>
        <Card className="divide-y divide-edge/60 p-1">
          <ListLink icon={Scale} title="Comparison workspace" desc="Saved side-by-side benchmarks" onClick={() => {}} />
          <ListLink icon={CreditCard} title="Billing & plan" desc="Student plan · Unlimited" onClick={() => {}} />
          <ListLink icon={Bell} title="Notifications" desc="Alerts, digests, and reminders" onClick={() => {}} />
        </Card>
      </section>

      <section className="animate-fade-slide-up">
        <SectionTitle>About</SectionTitle>
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold text-slate-100">ClauseGuard v1.0.0</p>
            <p className="text-[11px] text-slate-500">AI-Powered T&C & Privacy Policy Risk Analyzer · HackFusion.</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Up to date
          </span>
        </Card>
        <button
          onClick={() => {}}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>

      <button
        onClick={save}
        className="sticky bottom-20 z-10 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 active:scale-[0.98] lg:bottom-6"
      >
        Save changes
      </button>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-fade-slide-up rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-300 backdrop-blur lg:bottom-8">
          <span className="mr-1.5">✓</span>{toast}
        </div>
      )}
    </div>
  )
}
