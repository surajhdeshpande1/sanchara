export function ShikharaMark({ size = 28, className = '' }: { size?: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      {/* Tier 1 (bottom): width 24 */}
      <rect x="4" y="24" width="24" height="4" rx="2" />
      {/* Tier 2: width 18 */}
      <rect x="7" y="19" width="18" height="4" rx="2" />
      {/* Turmeric dot on Tier 2 */}
      <circle cx="16" cy="21" r="1.5" fill="var(--color-arishina-500)" />
      {/* Tier 3: width 12 */}
      <rect x="10" y="14" width="12" height="4" rx="2" />
      {/* Tier 4: width 7 */}
      <rect x="12.5" y="9" width="7" height="4" rx="1.5" />
      {/* Finial / Spire */}
      <circle cx="16" cy="6" r="2" />
      <rect x="15.5" y="1" width="1" height="4" rx="0.5" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <div className="inline-flex items-center gap-2">
      <ShikharaMark size={26} className="text-kempu-700" />
      <span className="display text-[1.35rem] text-kallu-900 tracking-tight">SANCHARA<span className="text-kempu-700">.AI</span></span>
    </div>
  )
}

export function StitchLoader({ size = 120 }: { size?: number }) {
  const stitches = [
    // Center 5 (arishina-500)
    { x: 4, y: 4, c: 'text-arishina-500' },
    { x: 4, y: 3, c: 'text-arishina-500' },
    { x: 4, y: 5, c: 'text-arishina-500' },
    { x: 3, y: 4, c: 'text-arishina-500' },
    { x: 5, y: 4, c: 'text-arishina-500' },
    // Outer 12 (kempu-700)
    { x: 4, y: 2, c: 'text-kempu-700' },
    { x: 4, y: 6, c: 'text-kempu-700' },
    { x: 2, y: 4, c: 'text-kempu-700' },
    { x: 6, y: 4, c: 'text-kempu-700' },
    { x: 3, y: 3, c: 'text-kempu-700' },
    { x: 5, y: 3, c: 'text-kempu-700' },
    { x: 3, y: 5, c: 'text-kempu-700' },
    { x: 5, y: 5, c: 'text-kempu-700' },
    // Tips
    { x: 4, y: 1, c: 'text-kempu-700' },
    { x: 4, y: 7, c: 'text-kempu-700' },
    { x: 1, y: 4, c: 'text-kempu-700' },
    { x: 7, y: 4, c: 'text-kempu-700' },
  ]

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-hidden="true">
      <style>{`
        @keyframes stitch {
          0% { stroke-dashoffset: 12; opacity: 0.2; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.2; }
        }
      `}</style>
      {stitches.map((s, i) => {
        const cx = s.x * 10
        const cy = s.y * 10
        const delay = (i * 0.09).toFixed(2)
        return (
          <g key={i} className={s.c} style={{ animation: `stitch 2.4s ease-in-out infinite ${delay}s`, strokeDasharray: 12, strokeDashoffset: 12, opacity: 0.2 }}>
            <line x1={cx - 3} y1={cy - 3} x2={cx + 3} y2={cy + 3} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={cx - 3} y1={cy + 3} x2={cx + 3} y2={cy - 3} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )
      })}
    </svg>
  )
}

export function IlkalBand({ className = '' }: { className?: string }) {
  return <div className={`ilkal-band ${className}`} />
}

export function KasutiRule({ className = '' }: { className?: string }) {
  return <div className={`kasuti-rule ${className}`} />
}
