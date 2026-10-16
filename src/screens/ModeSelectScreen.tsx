import { useState } from 'react'
import { useApp } from '../app/AppContext'
import { MODE_ORDER, MODES } from '../app/modes'
import { Guide } from '../components/mascot/Guide'
import { Button } from '../components/ui/Button'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import type { ModeId, SchoolFilter } from '../types'

interface ModeSelectScreenProps {
  onSelect: (mode: ModeId, schoolFilter: SchoolFilter) => void
  onBack: () => void
}

const FILTERS: { id: SchoolFilter; label: string }[] = [
  { id: 'all', label: 'ぜんぶ（14校）' },
  { id: 'elementary', label: '小学校（9校）' },
  { id: 'junior-high', label: '中学校（5校）' },
]

export function ModeSelectScreen({ onSelect, onBack }: ModeSelectScreenProps) {
  const { save, play } = useApp()
  const [filter, setFilter] = useState<SchoolFilter>('all')
  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-3" data-testid="mode-screen">
      <ScreenHeader title="どれであそぶ？" onBack={onBack} />
      <Guide size="sm">今日は どれに ちょうせん するたん？</Guide>
      <ul className="flex flex-col gap-3 pb-4">
        {MODE_ORDER.map((id) => {
          const m = MODES[id]
          const best = save.highScores[id]
          return (
            <li key={id} className="rounded-3xl bg-white p-3 shadow-card">
              <div className="flex items-start gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {m.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black leading-tight">{m.title}</h2>
                  <p className="mt-0.5 text-sm text-ink-soft">{m.description}</p>
                  <p className="mt-0.5 text-xs font-bold text-ink-soft">
                    {m.questionCount ? `${m.questionCount}問` : `${m.timeLimit}びょう`}
                    {best > 0 && ` ／ さいこう ${best}てん`}
                  </p>
                </div>
              </div>
              {id === 'school' && (
                <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="出題する学校">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={filter === f.id}
                      data-testid={`filter-${f.id}`}
                      className={`focus-ring min-h-9 rounded-full border-2 px-3 text-xs font-bold ${filter === f.id ? 'border-primary bg-primary text-ink' : 'border-line bg-white text-ink'}`}
                      onClick={() => {
                        play('tap')
                        setFilter(f.id)
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 flex justify-end">
                <Button size="md" onClick={() => onSelect(id, id === 'school' ? filter : 'all')} data-testid={`mode-${id}`}>
                  スタート！
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
