import { useMemo, useState } from 'react'
import { useApp } from '../app/AppContext'
import { EntryDetail } from '../components/encyclopedia/EntryDetail'
import { Guide } from '../components/mascot/Guide'
import { Button } from '../components/ui/Button'
import { CATEGORY_INFO } from '../components/ui/CategoryBadge'
import { Ruby } from '../components/ui/Ruby'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Sheet } from '../components/ui/Sheet'
import { DISTRICTS } from '../data/districts'
import { ENTRY_COUNTS, FACILITIES, TOTAL_ENTRIES } from '../data/facilities'
import { LINES } from '../data/lines'
import { entryInfo } from '../lib/entries'
import { isDiscovered } from '../lib/storage'
import type { EntryCategory } from '../types'

interface EncyclopediaScreenProps {
  onBack: () => void
  /** 最初に開く項目（クイズや探検から来たとき） */
  initialId?: string | null
}

const TABS: EntryCategory[] = ['elementary', 'junior-high', 'library', 'children-center', 'district']

export function EncyclopediaScreen({ onBack, initialId = null }: EncyclopediaScreenProps) {
  const { save, play } = useApp()
  const [tab, setTab] = useState<EntryCategory>(() => (initialId ? entryInfo(initialId).category : 'elementary'))
  const [openId, setOpenId] = useState<string | null>(initialId)

  const entries = useMemo(() => {
    if (tab === 'district') return DISTRICTS.map((d) => ({ id: d.id, name: d.name, kana: d.kana }))
    return FACILITIES.filter((f) => f.category === tab).map((f) => ({ id: f.id, name: f.name, kana: f.kana }))
  }, [tab])

  const counts = useMemo(() => {
    const perCategory = {} as Record<EntryCategory, number>
    for (const c of TABS) perCategory[c] = 0
    for (const f of FACILITIES) if (isDiscovered(save, f.id)) perCategory[f.category]++
    for (const d of DISTRICTS) if (isDiscovered(save, d.id)) perCategory.district++
    const total = Object.values(perCategory).reduce((a, b) => a + b, 0)
    return { perCategory, total, rate: Math.round((total / TOTAL_ENTRIES) * 100) }
  }, [save])

  const complete = counts.total === TOTAL_ENTRIES

  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-3" data-testid="zukan-screen">
      <ScreenHeader title="かまがや図鑑" onBack={onBack} />
      <div className="rounded-3xl bg-white p-3 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink-soft">コンプリート率</span>
          <span className="text-xl font-black" data-testid="discovered-count">
            {counts.total}
            <span className="text-sm text-ink-soft">/{TOTAL_ENTRIES}</span>
            <span className="ml-2 text-base text-primary-dark" data-testid="complete-rate">
              {counts.rate}%
            </span>
          </span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-cream" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_ENTRIES} aria-valuenow={counts.total}>
          <div className="h-full rounded-full bg-mint transition-[width] duration-500" style={{ width: `${counts.rate}%` }} />
        </div>
        {complete && (
          <Guide size="sm" className="mt-3" testId="complete-banner">
            🎉 {LINES.complete[0]}
          </Guide>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin" role="tablist" aria-label="図鑑のカテゴリ">
        {TABS.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={tab === c}
            data-testid={`tab-${c}`}
            className={`focus-ring inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full border-2 px-3 text-sm font-bold ${tab === c ? 'text-white' : 'border-line bg-white text-ink'}`}
            style={tab === c ? { backgroundColor: CATEGORY_INFO[c].hex, borderColor: CATEGORY_INFO[c].hex } : undefined}
            onClick={() => {
              play('tap')
              setTab(c)
            }}
          >
            <span aria-hidden="true">{CATEGORY_INFO[c].emoji}</span>
            {CATEGORY_INFO[c].label}
            <span className="rounded-full bg-white/80 px-1.5 text-[10px] text-ink">
              {counts.perCategory[c]}/{ENTRY_COUNTS[c]}
            </span>
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3" data-testid="zukan-grid">
        {entries.map((e) => {
          const found = isDiscovered(save, e.id)
          return (
            <li key={e.id}>
              <button
                type="button"
                className={`btn-pop focus-ring flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-3xl bg-white p-2 text-center ${found ? '' : 'card-undiscovered'}`}
                data-testid="zukan-card"
                data-id={e.id}
                data-discovered={found}
                onClick={() => {
                  play('tap')
                  setOpenId(e.id)
                }}
                aria-label={found ? e.name : `まだ見つけていない${CATEGORY_INFO[tab].label}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${CATEGORY_INFO[tab].hex}33` }} aria-hidden="true">
                  {found ? CATEGORY_INFO[tab].emoji : '？'}
                </span>
                <span className="text-sm font-bold leading-tight">{found ? <Ruby text={e.name} kana={e.kana} /> : '？？？'}</span>
                {!found && <span className="text-[10px] text-ink-soft">みはっけん</span>}
              </button>
            </li>
          )
        })}
      </ul>

      <Sheet open={openId !== null} onClose={() => setOpenId(null)} title="図鑑の詳細" testId="zukan-detail">
        {openId && (
          <>
            <EntryDetail id={openId} discovered={isDiscovered(save, openId)} />
            <div className="mt-3 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setOpenId(null)} data-testid="detail-close">
                とじる
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  )
}
