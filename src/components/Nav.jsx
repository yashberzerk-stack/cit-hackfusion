import { Home, History, Scale, Settings, ShieldAlert, Wand2 } from 'lucide-react'

const ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'analyze', label: 'Analyze', icon: Wand2 },
  { id: 'compare', label: 'Compare', icon: Scale },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function BottomNav({ activeTab, onNavigate }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-edge/70 bg-surface/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((item) => {
          const active = activeTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center gap-1 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] text-[9.5px] font-semibold transition ${
                active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-400" />}
              <Icon className={`h-5 w-5 ${active ? 'drop-shadow-[0_0_6px_rgba(129,140,248,0.6)]' : ''}`} />
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function Sidebar({ activeTab, onNavigate }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-edge/70 bg-surface lg:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/25">
          <ShieldAlert size={22} className="text-white" />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight text-white">ClauseGuard</p>
          <p className="text-[11px] text-slate-400">AI Policy Risk Analyzer</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {ITEMS.map((item) => {
          const active = activeTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'text-slate-400 hover:bg-card hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mx-3 mb-4 rounded-2xl border border-edge bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <p className="text-xs font-semibold text-slate-200">Model: Llama-3 · 8B</p>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          Zero-shot clause extraction active. 42 analyses cached this week.
        </p>
      </div>
    </aside>
  )
}
