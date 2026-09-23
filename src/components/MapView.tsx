import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { useT } from '../lib/i18n'

export interface MapPoint {
  id: string
  location: { lat: number; lng: number }
  kind: 'heritage' | 'nature' | 'spiritual' | 'craft' | 'museum' | 'local' | 'meal'
  label: string
  crowd?: number
  order?: number
  onClick?: () => void
}

export function MapView({ points, route, routeEstimated = true, className = 'h-[40vh]' }: { points: MapPoint[]; route?: {lat: number; lng: number}[]; routeEstimated?: boolean; className?: string }) {
  const { t } = useT()
  const isMobile = L.Browser.mobile
  const mapRef = useRef<L.Map | null>(null)

  const center: L.LatLngTuple = [15.99, 75.87]

  return (
    <div className={`relative ${className}`}>
      <MapContainer 
        center={center} 
        zoom={10} 
        scrollWheelZoom={false} 
        dragging={!isMobile} 
        touchZoom={true}
        className="w-full h-full z-0"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        
        {route && (
          <Polyline 
            positions={route} 
            color="#b91c1c"
            weight={4}
            dashArray={routeEstimated ? "8 8" : undefined}
          />
        )}
        
        {points.map(pt => (
          <Marker 
            key={pt.id} 
            position={[pt.location.lat, pt.location.lng]}
            icon={createIcon(pt)}
            eventHandlers={{ click: pt.onClick }}
          >
            <Tooltip>{pt.label}</Tooltip>
          </Marker>
        ))}

        <MapBounds points={points} route={route} />
      </MapContainer>

      {isMobile && (
        <div className="absolute bottom-4 left-4 z-[400] bg-kallu-900/80 backdrop-blur text-white text-[11px] font-medium px-3 py-1.5 rounded-full pointer-events-none">
          {t('map.hint' as any)}
        </div>
      )}
    </div>
  )
}

function MapBounds({ points, route }: { points: MapPoint[], route?: {lat: number; lng: number}[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const bounds = L.latLngBounds([])
    points.forEach(p => bounds.extend([p.location.lat, p.location.lng]))
    route?.forEach(p => bounds.extend([p.lat, p.lng]))
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
    }
  }, [map, points, route])
  return null
}

function createIcon(pt: MapPoint) {
  const isBiz = pt.kind === 'craft' || pt.kind === 'local' || pt.kind === 'meal'
  const fill = isBiz ? '#15803d' : '#b91c1c'
  
  let path = ''
  if (pt.kind === 'heritage') path = '<polygon points="15,2 28,15 15,28 2,15" />'
  else if (pt.kind === 'nature') path = '<circle cx="15" cy="15" r="12" />'
  else if (pt.kind === 'spiritual') path = '<polygon points="15,2 19,11 28,15 19,19 15,28 11,19 2,15 11,11" />'
  else if (pt.kind === 'craft' || pt.kind === 'local') path = '<rect x="3" y="3" width="24" height="24" rx="4" />'
  else if (pt.kind === 'museum') path = '<rect x="4" y="4" width="22" height="22" />'
  else if (pt.kind === 'meal') path = '<circle cx="15" cy="15" r="13" />'
  else path = '<polygon points="15,2 28,15 15,28 2,15" />'

  let ring = ''
  if (pt.crowd && pt.crowd >= 70) ring = '<circle cx="15" cy="15" r="14" fill="none" stroke="#b91c1c" stroke-width="2" />'
  else if (pt.crowd && pt.crowd >= 40) ring = '<circle cx="15" cy="15" r="14" fill="none" stroke="#ca8a04" stroke-width="2" />'

  const content = `
    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
      ${ring}
      <g fill="${fill}">${path}</g>
      ${pt.order ? `<text x="15" y="19" font-family="sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${pt.order}</text>` : ''}
    </svg>
  `
  
  return L.divIcon({
    html: content,
    className: 'bg-transparent',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    tooltipAnchor: [15, -15]
  })
}
