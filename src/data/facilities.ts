import type { EntryCategory, Facility, FacilityCategory } from '../types'
import { CHILDREN_CENTERS } from './children-centers'
import { DISTRICTS } from './districts'
import { LIBRARIES } from './libraries'
import { ELEMENTARY_SCHOOLS, JUNIOR_HIGH_SCHOOLS, SCHOOLS } from './schools'

export { ELEMENTARY_SCHOOLS, JUNIOR_HIGH_SCHOOLS, SCHOOLS, LIBRARIES, CHILDREN_CENTERS, DISTRICTS }

/** 図書館 + 児童センター（施設探しクイズの対象） */
export const PUBLIC_FACILITIES: Facility[] = [...LIBRARIES, ...CHILDREN_CENTERS]

export const FACILITIES: Facility[] = [...SCHOOLS, ...PUBLIC_FACILITIES]

export const FACILITY_BY_ID: ReadonlyMap<string, Facility> = new Map(FACILITIES.map((f) => [f.id, f]))

export function getFacility(id: string): Facility {
  const f = FACILITY_BY_ID.get(id)
  if (!f) throw new Error(`unknown facility: ${id}`)
  return f
}

export function facilitiesOf(category: FacilityCategory): Facility[] {
  return FACILITIES.filter((f) => f.category === category)
}

/** 図鑑の収録数（データから自動計算） */
export const ENTRY_COUNTS: Record<EntryCategory, number> = {
  elementary: ELEMENTARY_SCHOOLS.length,
  'junior-high': JUNIOR_HIGH_SCHOOLS.length,
  library: LIBRARIES.length,
  'children-center': CHILDREN_CENTERS.length,
  district: DISTRICTS.length,
}

export const TOTAL_ENTRIES = Object.values(ENTRY_COUNTS).reduce((a, b) => a + b, 0)

/** 図鑑に載るすべての ID */
export const ALL_ENTRY_IDS: string[] = [...FACILITIES.map((f) => f.id), ...DISTRICTS.map((d) => d.id)]

export function categoryOfId(id: string): EntryCategory {
  const f = FACILITY_BY_ID.get(id)
  if (f) return f.category
  if (id.startsWith('town-')) return 'district'
  throw new Error(`unknown entry: ${id}`)
}
