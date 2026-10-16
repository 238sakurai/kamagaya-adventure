import type { EntryCategory } from '../../types'

export interface CategoryInfo {
  label: string
  kana: string
  emoji: string
  /** Tailwind のテーマ色トークン名 */
  color: string
  hex: string
}

export const CATEGORY_INFO: Record<EntryCategory, CategoryInfo> = {
  elementary: { label: '小学校', kana: 'しょうがっこう', emoji: '🏫', color: 'cat-elementary', hex: '#4f8fe6' },
  'junior-high': { label: '中学校', kana: 'ちゅうがっこう', emoji: '🎒', color: 'cat-junior', hex: '#9c6ade' },
  library: { label: '図書館', kana: 'としょかん', emoji: '📖', color: 'cat-library', hex: '#3fae6a' },
  'children-center': { label: '児童センター', kana: 'じどうセンター', emoji: '🪁', color: 'cat-center', hex: '#ff8a3d' },
  district: { label: '町名', kana: 'ちょうめい', emoji: '🏘️', color: 'cat-district', hex: '#f2c230' },
}

export function CategoryBadge({ category, className = '' }: { category: EntryCategory; className?: string }) {
  const info = CATEGORY_INFO[category]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${className}`}
      style={{ backgroundColor: info.hex }}
    >
      <span aria-hidden="true">{info.emoji}</span>
      {info.label}
    </span>
  )
}
