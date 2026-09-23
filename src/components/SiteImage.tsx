import { ShikharaMark } from './Patterns'
import { useT } from '../lib/i18n'
import type { Site } from '../engine/types'

export function SiteImage({ site, className = '', showCredit = true }: { site: Site; className?: string; showCredit?: boolean }) {
  const { t } = useT()
  const img = site.images?.[0]

  if (img) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={img.src} alt={site.name.en} className="w-full h-full object-cover" loading="lazy" />
        {showCredit && img.credit && (
          <div className="absolute bottom-1 right-1 bg-kallu-900/55 backdrop-blur-sm text-hatti-50 text-[10px] px-2 py-0.5 rounded">
            {t('site.credit' as any)}: {img.credit} · {img.license}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-kempu-700 via-maralu-500 to-arishina-500 ${className}`}>
      <div className="absolute inset-0 grain opacity-20" />
      <div className="h-12 w-12 text-hatti-50 opacity-90 relative z-10 drop-shadow-md"><ShikharaMark /></div>
      <div className="kicker text-hatti-50 opacity-90 mt-2 relative z-10 tracking-widest text-center px-4">
        {site.name.en}
      </div>
      <div className="text-[10px] text-hatti-50/70 absolute bottom-2 relative z-10">{t('site.noPhoto' as any)}</div>
    </div>
  )
}
