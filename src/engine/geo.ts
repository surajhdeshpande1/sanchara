// Distance and geospatial logic.
// Haversine and rural North-Karnataka road estimates.
import type { LatLng } from './types'

export const R = 6371.0088
export const ROAD_FACTOR = 1.32
export const AVG_KMH = 34
export const OVERHEAD_MIN = 4

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180

  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))
  return R * c
}

export function estimateLeg(a: LatLng, b: LatLng): { km: number; min: number } {
  const straight = haversineKm(a, b)
  if (straight < 0.25) {
    return { km: straight, min: Math.max(2, Math.round(straight * 15)) }
  }
  const km = straight * ROAD_FACTOR
  return { km, min: Math.round((km / AVG_KMH) * 60 + OVERHEAD_MIN) }
}

export const DISTRICT_BBOX = { minLat: 15.75, maxLat: 16.75, minLng: 75.05, maxLng: 76.35 }

export function inDistrict(p: LatLng): boolean {
  return p.lat >= DISTRICT_BBOX.minLat && p.lat <= DISTRICT_BBOX.maxLat && p.lng >= DISTRICT_BBOX.minLng && p.lng <= DISTRICT_BBOX.maxLng
}
