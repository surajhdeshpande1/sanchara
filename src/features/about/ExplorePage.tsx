import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useT } from '../../lib/i18n'
import { useData } from '../../lib/data'
import { useNow } from '../../lib/hooks'
import { useStore } from '../../state/store'
import { estimateCrowd } from '../../engine/crowd'
import { MapView } from '../../components/MapView'
import type { MapPoint } from '../../components/MapView'
import { Chip, Pill } from '../../components/ui'
import { SiteImage } from '../../components/SiteImage'
import { CrowdBadge } from '../../components/CrowdBadge'
import type { SiteKind } from '../../engine/types'

export function ExplorePage() {
  const { t, lang, p } = useT()
  const navigate = useNavigate()
  const data = useData()
  const now = useNow()
  const overrides = useStore(s => s.overrides)
  const reports = useStore(s => s.reports)

  const [filter, setFilter] = useState<SiteKind | 'all'>('all')

  const plannableSites = data.sites.filter(s => s.plannable)
  const filtered = filter === 'all' ? plannableSites : plannableSites.filter(s => s.kind === filter)

  const kinds: (SiteKind | 'all')[] = ['all', 'heritage', 'spiritual', 'nature', 'craft', 'museum']

  const points: MapPoint[] = filtered.map(s => {
    const crowd = estimateCrowd(s, now, data.crowd as any, overrides, reports)
    return {
      id: s.id,
      location: s.location,
      kind: s.kind,
      label: p(s.name),
      crowd: crowd.score,
      onClick: () => navigate(`/site/${s.id}`)
    }
  })

  return (
    <div className="pb-24 flex flex-col min-h-dvh bg-hatti-50">
      <div className="h-[40vh] shrink-0 border-b border-maralu-200">
        <MapView points={points} className="w-full h-full" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-hatti-50/90 backdrop-blur z-20 py-3 border-b border-maralu-200">
          <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
            {kinds.map(k => (
              <Chip key={k} active={filter === k} onClick={() => setFilter(k)} className="whitespace-nowrap shrink-0">
                {t(`kind.${k}` as any)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {filtered.map(s => {
            const crowd = estimateCrowd(s, now, data.crowd as any, overrides, reports)
            return (
              <div key={s.id} onClick={() => navigate(`/site/${s.id}`)} role="button" className="flex gap-4 p-3 bg-white rounded-2xl border border-maralu-200 shadow-sm active:scale-[0.98] touch-manipulation transition-transform text-left">
                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-hatti-100">
                  <SiteImage site={s} showCredit={false} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                  <h3 className="font-bold text-kallu-900 text-[1.05rem] leading-tight mb-1 truncate" lang={lang}>{p(s.name)}</h3>
                  <p className="text-[13px] text-kallu-600 mb-2 truncate" lang={lang}>{p(s.short)}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-auto">
                    <CrowdBadge crowd={crowd} compact />
                    {s.tier === 'hidden' && <Pill tone="gold">Hidden gem</Pill>}
                    {s.scope === 'border' && <Pill tone="neutral">Border site</Pill>}
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center text-kallu-500 py-8">{t('explore.empty' as any)}</div>
          )}
        </div>
      </div>
    </div>
  )
}
