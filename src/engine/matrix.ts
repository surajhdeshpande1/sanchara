// Travel time oracle.
// Uses pre-computed route matrix or falls back to road estimate.
import type { RouteMatrix, LatLng } from './types'
import { estimateLeg } from './geo'

export interface Leg {
  min: number
  km: number
  routed: boolean
}

export class TravelOracle {
  constructor(public matrix: RouteMatrix) {}

  leg(a: { id?: string; location: LatLng }, b: { id?: string; location: LatLng }): Leg {
    if (a.id && b.id && a.id === b.id) {
      return { min: 0, km: 0, routed: true }
    }
    if (a.id && b.id) {
      const i = this.matrix.ids.indexOf(a.id)
      const j = this.matrix.ids.indexOf(b.id)
      if (i >= 0 && j >= 0) {
        const min = this.matrix.durationsMin[i][j]
        const km = this.matrix.distancesKm[i][j]
        if (min >= 0 && km >= 0) {
          return {
            min: Math.round(min),
            km,
            routed: this.matrix.method === 'heigit',
          }
        }
      }
    }
    const est = estimateLeg(a.location, b.location)
    return { min: est.min, km: est.km, routed: false }
  }
}
