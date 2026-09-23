import { Outlet, ScrollRestoration, NavLink, useLocation } from 'react-router'
import { useStore } from '../state/store'
import { useT } from '../lib/i18n'
import { useKeyboardOpen } from '../lib/hooks'
import { WifiOff, Home, Map, Scan, MessageCircle, Route } from 'lucide-react'
import { Wordmark, IlkalBand } from './Patterns'

export function AppShell() {
  const { lang, t } = useT()
  const setLang = useStore(s => s.setLang)
  const forcedOffline = useStore(s => s.forcedOffline)
  const isKbd = useKeyboardOpen()
  const loc = useLocation()

  const isProjector = loc.pathname.startsWith('/district')
  if (isProjector) {
    return <><ScrollRestoration /><Outlet /></>
  }

  const isOffline = !navigator.onLine || forcedOffline

  return (
    <div className="min-h-dvh bg-hatti-100 text-kallu-900 font-sans selection:bg-kempu-200">
      <ScrollRestoration />
      
      <header className="sticky top-0 z-40 bg-hatti-100/90 backdrop-blur pt-[env(safe-area-inset-top)] border-b border-maralu-200">
        <div className="h-1.5 w-full"><IlkalBand /></div>
        <div className="flex items-center justify-between px-4 min-h-14">
          <NavLink to="/" aria-label="Home" className="min-h-11 flex items-center active:scale-[0.97]">
            <div className="h-5"><Wordmark /></div>
          </NavLink>
          <div role="radiogroup" aria-label="Language" className="flex items-center bg-hatti-50 rounded-full p-1 border border-maralu-200">
            {(['kn', 'hi', 'en'] as const).map(l => {
              const active = lang === l
              return (
                <button
                  key={l}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setLang(l)}
                  className={`min-h-10 px-3 rounded-full text-sm font-medium transition-colors active:scale-[0.97] touch-manipulation ${active ? 'bg-kempu-700 text-white' : 'text-kallu-600'}`}
                >
                  {l === 'kn' ? 'ಕನ್ನಡ' : l === 'hi' ? 'हिन्दी' : 'EN'}
                </button>
              )
            })}
          </div>
        </div>
        {isOffline && (
          <div className="bg-kallu-900 text-white text-xs py-1.5 px-4 flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{forcedOffline ? t('offline.simulated' as any) : t('offline.banner' as any)}</span>
          </div>
        )}
      </header>

      <main className={`mx-auto max-w-5xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] ${isKbd ? '!pb-4' : ''}`}>
        <Outlet />
      </main>

      {!isKbd && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-hatti-50 border-t border-maralu-200 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-end justify-around max-w-md mx-auto px-2">
            <NavItem to="/" icon={<Home className="w-[22px] h-[22px]" />} label="Home" />
            <NavItem to="/explore" icon={<Map className="w-[22px] h-[22px]" />} label="Explore" />
            <NavLink to="/scan" className={({ isActive }) => `flex items-center justify-center w-14 h-14 rounded-full -mt-5 ring-4 ring-hatti-50 active:scale-[0.97] touch-manipulation transition-colors ${isActive ? 'bg-kempu-800 text-white' : 'bg-kempu-700 text-white'}`} aria-label="Scan">
              <Scan className="w-6 h-6" />
            </NavLink>
            <NavItem to="/ask" icon={<MessageCircle className="w-[22px] h-[22px]" />} label="Ask" />
            <NavItem to="/journey" icon={<Route className="w-[22px] h-[22px]" />} label="Journey" />
          </div>
        </nav>
      )}
    </div>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-14 min-w-[56px] active:scale-[0.97] touch-manipulation transition-colors ${isActive ? 'text-kempu-700' : 'text-kallu-500'}`}>
      {icon}
      <span className="text-[10px] mt-0.5 font-medium">{label}</span>
    </NavLink>
  )
}
