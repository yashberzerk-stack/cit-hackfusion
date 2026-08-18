import { useState } from 'react'
import { Bell, Menu, ShieldAlert, X } from 'lucide-react'

const NAV = [
  { id: 'home', label: 'Dashboard' },
  { id: 'analyze', label: 'Analyzer' },
  { id: 'compare', label: 'Compare' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

export default function Header({ activeTab, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-edge/70 bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 lg:pl-72">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/25">
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-bold leading-tight tracking-tight text-white">
            ClauseGuard
            <span className="ml-2 hidden text-[11px] font-semibold text-slate-400 sm:inline">AI Policy Risk Analyzer</span>
          </h1>
          <p className="text-[11px] text-slate-400">Stop clicking blind. Know your risk before you agree.</p>
        </div>

        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 md:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          NLP engine ready
        </span>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-card text-slate-300 transition hover:text-white">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-400" />
        </button>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-card text-slate-300 transition hover:text-white lg:hidden"
          aria-label="Menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-edge/70 bg-card px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  onNavigate(n.id)
                  setMenuOpen(false)
                }}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  activeTab === n.id ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-300 hover:bg-card-soft'
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
