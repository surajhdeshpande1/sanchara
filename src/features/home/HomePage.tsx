
import { CrowdBadge } from '../../components/CrowdBadge'
import { SiteImage } from '../../components/SiteImage'
import { SourceChip } from '../../components/SourceChip'
import { BusinessCard } from '../../components/BusinessCard'
import { MapView } from '../../components/MapView'
import type { MapPoint } from '../../components/MapView'
import { useData } from '../../lib/data'
import { estimateCrowd } from '../../engine/crowd'

export function HomePage() {
  
  const data = useData()
  
  const badami = data.siteById.get('badami-caves')
  const biz = data.businesses[0]
  const sourceIds = badami ? data.facts.filter(f => f.siteId === 'badami-caves').flatMap(f => f.sources) : []
  
  let crowd: any = { score: 45, level: 'low' }
  if (badami) {
    crowd = estimateCrowd(badami, Date.now(), (data.crowd as any), [], [])
  }

  const mapPoints: MapPoint[] = data.sites.slice(0, 5).map(s => ({
    id: s.id,
    location: { lat: s.location.lat, lng: s.location.lng },
    kind: 'heritage',
    label: s.name.en,
    crowd: crowd.score
  }))

  return (
    <div className="py-12 flex flex-col gap-8">
      <div className="text-center text-kallu-500">HomePage Placeholder</div>
      
      {badami && (
        <div className="space-y-6 border-t border-maralu-200 pt-6 mt-6">
          <h2 className="display text-xl text-kallu-900">S4 Component Check</h2>
          
          <div>
            <h3 className="kicker mb-2">CrowdBadge</h3>
            <CrowdBadge crowd={crowd} />
          </div>

          <div>
            <h3 className="kicker mb-2">SiteImage</h3>
            <div className="w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden border border-maralu-200 shadow-sm">
              <SiteImage site={badami} />
            </div>
          </div>

          <div>
            <h3 className="kicker mb-2">SourceChip</h3>
            <SourceChip sourceIds={sourceIds} />
          </div>

          {biz && (
            <div>
              <h3 className="kicker mb-2">BusinessCard</h3>
              <div className="max-w-sm">
                <BusinessCard biz={biz} why="Famous for local lunch" distanceKm={1.2} />
              </div>
            </div>
          )}

          <div>
            <h3 className="kicker mb-2">MapView</h3>
            <div className="w-full h-[40vh] rounded-xl overflow-hidden border border-maralu-200 shadow-sm relative z-0">
              <MapView points={mapPoints} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
