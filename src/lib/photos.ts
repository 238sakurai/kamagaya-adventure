import type { EntryPhoto } from '../types'

/** 写真ファイルの URL。src は BASE_URL からの相対パス */
export function photoUrl(photo: EntryPhoto): string {
  return `${import.meta.env.BASE_URL}${photo.src}`
}
