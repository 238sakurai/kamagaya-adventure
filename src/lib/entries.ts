import { DISTRICT_BY_ID } from '../data/districts'
import { FACILITY_BY_ID } from '../data/facilities'
import type { EntryCategory } from '../types'

export interface EntryInfo {
  id: string
  name: string
  kana: string
  category: EntryCategory
}

/** 施設 ID でも町名 ID でも、表示用の名前と読みを返す */
export function entryInfo(id: string): EntryInfo {
  const f = FACILITY_BY_ID.get(id)
  if (f) return { id, name: f.name, kana: f.kana, category: f.category }
  const d = DISTRICT_BY_ID.get(id)
  if (d) return { id, name: d.name, kana: d.kana, category: 'district' }
  throw new Error(`unknown entry: ${id}`)
}
