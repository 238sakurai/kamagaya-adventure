import { DISTRICTS } from '../data/districts'
import { PUBLIC_FACILITIES } from '../data/facilities'
import { distanceKm } from './geo'
import type { BBox, Facility, FacilityCategory, Point } from '../types'

/** 市内でのおおまかな位置（北・南・東・西・真ん中）。重心と viewBox から機械的に決める */
export function describePosition(centroid: Point, viewBox: BBox): string {
  const [, , w, h] = viewBox
  const fx = centroid[0] / w
  const fy = centroid[1] / h
  const ns = fy < 0.36 ? '北' : fy > 0.64 ? '南' : ''
  const ew = fx < 0.36 ? '西' : fx > 0.64 ? '東' : ''
  if (!ns && !ew) return '市の真ん中あたり'
  return `市の${ns}${ew}のほう`
}

/** 施設の所在町名 → 町名 ID（住所の町名と小地域の町名は同じ表記） */
export function districtIdForTown(town: string): string | null {
  return DISTRICTS.find((d) => d.name === town)?.id ?? null
}

export interface NearbyFacility {
  facility: Facility
  km: number
}

/**
 * 地理的な距離が近い施設（直線距離）。通学区域とは関係がない。
 */
export function nearbyFacilities(from: Pick<Facility, 'latitude' | 'longitude'>, category: FacilityCategory, limit = 2): NearbyFacility[] {
  return PUBLIC_FACILITIES.filter((f) => f.category === category)
    .map((facility) => ({ facility, km: distanceKm(from.latitude, from.longitude, facility.latitude, facility.longitude) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
}

export const formatKm = (km: number): string => (km < 1 ? `約${Math.round(km * 100) * 10}m` : `約${km.toFixed(1)}km`)
