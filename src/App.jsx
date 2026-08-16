import { useEffect, useState } from 'react'
import Header from './components/Header'
import { BottomNav, Sidebar } from './components/Nav'
import Dashboard from './components/Dashboard'
import Analyzer from './components/Analyzer'
import Compare from './components/Compare'
import History from './components/History'
import Settings from './components/Settings'
import { HISTORY } from './data'

export default function App() {
  const [tab, setTab] = useState('home')
  const [history, setHistory] = useState(HISTORY)

  // Load persisted history from localStorage (if present)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('clauseguard:history')
      if (raw) setHistory(JSON.parse(raw))
    } catch (e) {
      // ignore
    }
  }, [])

  // Persist history whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('clauseguard:history', JSON.stringify(history))
    } catch (e) {
      // ignore
    }
  }, [history])

  // Support opening app with ?domain=example.com to auto-analyze
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const domain = params.get('domain')
      if (domain) {
        setTab('analyze')
        // pass initial input via location state — Analyzer will accept via URL
        window.__CLAUSEGUARD_INITIAL = domain
      }
    } catch (e) {}
  }, [])

  function navigate(next) {
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  function addAnalysis(res) {
    const entry = {
      id: `live-${Date.now()}`,
      name: res.company !== 'Untitled policy' ? res.company : res.domain.split('.')[0],
      domain: res.domain,
      type: res.type,
      date: new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      overall: res.overall,
      riskScore: res.riskScore,
      tags: [res.overall === 'low' ? 'Low risk' : res.overall === 'moderate' ? 'Moderate' : 'High risk', 'Just analyzed'],
    }
    setHistory((prev) => [entry, ...prev])
  }

  return (
    <div className="min-h-dvh bg-surface text-slate-200">
      <Header activeTab={tab} onNavigate={navigate} />
      <Sidebar activeTab={tab} onNavigate={navigate} />

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-5 lg:pl-72 lg:pr-6 lg:pb-16">
        {tab === 'home' && <Dashboard onNavigate={navigate} />}
        {tab === 'analyze' && (
          <Analyzer
            onDone={addAnalysis}
            // provide initial input if the extension or URL set a domain
            initialInput={typeof window !== 'undefined' && window.__CLAUSEGUARD_INITIAL ? window.__CLAUSEGUARD_INITIAL : null}
            autoRun={Boolean(typeof window !== 'undefined' && window.__CLAUSEGUARD_INITIAL)}
          />
        )}
        {tab === 'compare' && <Compare />}
        {tab === 'history' && <History items={history} />}
        {tab === 'settings' && <Settings />}
      </main>

      <BottomNav activeTab={tab} onNavigate={navigate} />
    </div>
  )
}
