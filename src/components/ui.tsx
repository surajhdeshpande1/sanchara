import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { KasutiRule } from './Patterns'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'dark'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold touch-manipulation select-none active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none transition-transform"
  const variants = {
    primary: "bg-kempu-700 text-hatti-50 shadow-[var(--shadow-lift)] hover:bg-kempu-800",
    secondary: "bg-hatti-50 text-kempu-800 border-2 border-kempu-700/80",
    ghost: "text-kempu-800 hover:bg-kempu-50",
    gold: "bg-arishina-500 text-kallu-900",
    dark: "bg-kallu-900 text-hatti-50"
  }
  const sizes = {
    sm: "min-h-10 px-3.5 text-sm",
    md: "min-h-12 px-5 text-base",
    lg: "min-h-14 px-6 text-lg"
  }
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
}

export function Chip({ active, onClick, children, className = '' }: { active?: boolean, onClick?: () => void, children: ReactNode, className?: string }) {
  const base = "inline-flex min-h-11 items-center rounded-full border-2 px-3.5 text-[0.95rem] touch-manipulation select-none active:scale-[0.97] transition-all"
  const state = active ? "border-kempu-700 bg-kempu-700 text-hatti-50" : "bg-hatti-50 border-hatti-300 text-kallu-900"
  return <button onClick={onClick} aria-pressed={active} className={`${base} ${state} ${className}`}>{children}</button>
}

export function Pill({ tone = 'neutral', className = '', children }: { tone?: 'neutral'|'red'|'gold'|'green'|'indigo'|'dark', className?: string, children: ReactNode }) {
  const tones = {
    neutral: "bg-hatti-300 text-kallu-900",
    red: "bg-kempu-100 text-kempu-900",
    gold: "bg-arishina-100 text-kallu-900",
    green: "bg-hasiru-100 text-hasiru-900",
    indigo: "bg-neeli-100 text-neeli-900",
    dark: "bg-kallu-900 text-hatti-50"
  }
  return <span className={`inline-block px-2.5 py-0.5 text-[0.8rem] font-semibold rounded-full ${tones[tone]} ${className}`}>{children}</span>
}

export function Section({ title, kicker, action, className = '', children }: { title: string, kicker?: string, action?: ReactNode, className?: string, children: ReactNode }) {
  return (
    <section className={`mt-7 ${className}`}>
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          {kicker && <div className="kicker text-kempu-700 mb-1">{kicker}</div>}
          <h2 className="display text-2xl text-kallu-900">{title}</h2>
          <KasutiRule className="w-24 mt-2" />
        </div>
        {action && <div>{action}</div>}
      </header>
      {children}
    </section>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="close"
            className="fixed inset-0 z-40 w-full h-full bg-kallu-900/45 cursor-default block"
          />
          <motion.div 
            role="dialog" aria-modal="true"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-hatti-50 rounded-t-[1.75rem] max-h-[85dvh] overflow-y-auto overscroll-contain shadow-2xl"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
          >
            <div className="sticky top-0 bg-hatti-50 z-10 px-6 py-4 flex items-center justify-between border-b border-hatti-200">
              <h2 className="display text-2xl text-kallu-900">{title}</h2>
              <button onClick={onClose} aria-label="Close sheet" className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-hatti-200 text-kallu-900 touch-manipulation active:scale-95">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Stat({ value, label, tone = 'text-kempu-700', className = '' }: { value: string | number, label: string, tone?: string, className?: string }) {
  return (
    <div className={`card p-4 flex flex-col justify-center ${className}`}>
      <div className={`display text-4xl mb-1 ${tone}`}>{value}</div>
      <div className="text-sm font-semibold text-kallu-700">{label}</div>
    </div>
  )
}
