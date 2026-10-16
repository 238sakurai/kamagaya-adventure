import { useEffect, useState } from 'react'
import { useApp } from '../app/AppContext'
import { MODES } from '../app/modes'
import { Confetti } from '../components/effects/Confetti'
import { Guide } from '../components/mascot/Guide'
import { Button } from '../components/ui/Button'
import { Ruby } from '../components/ui/Ruby'
import { titleFor } from '../data/titles'
import { entryInfo } from '../lib/entries'
import type { GameSummary } from '../types'

interface ResultScreenProps {
  summary: GameSummary
  onReplay: () => void
  onModes: () => void
  onZukan: () => void
  onTitle: () => void
}

export function ResultScreen({ summary, onReplay, onModes, onZukan, onTitle }: ResultScreenProps) {
  const { save } = useApp()
  const config = MODES[summary.mode]
  const rank = titleFor(summary.mode, summary.correct, summary.score)
  const [burst, setBurst] = useState(0)
  useEffect(() => {
    if (summary.isNewRecord || rank.title.includes('マスター')) setBurst(1)
  }, [summary.isNewRecord, rank.title])

  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center gap-3" data-testid="result-screen">
      <h1 className="pt-2 text-2xl font-black">けっか はっぴょう！</h1>
      <div className="w-full rounded-3xl bg-white p-4 text-center shadow-card">
        <p className="text-sm font-bold text-ink-soft">
          {config.emoji} {config.title}
        </p>
        <p className="mt-2 text-xs font-bold text-ink-soft">きみの称号</p>
        <p className="text-2xl font-black text-primary-dark" data-testid="rank-title">
          <Ruby text={rank.title} kana={rank.kana} />
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-cream py-2">
            <div className="text-[11px] font-bold text-ink-soft">スコア</div>
            <div className="text-xl font-black" data-testid="stat-score">
              {summary.score}
            </div>
          </div>
          <div className="rounded-2xl bg-cream py-2">
            <div className="text-[11px] font-bold text-ink-soft">せいかい</div>
            <div className="text-xl font-black" data-testid="stat-correct">
              {summary.correct}
              <span className="text-xs text-ink-soft">/{summary.answered}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-cream py-2">
            <div className="text-[11px] font-bold text-ink-soft">さいだいれんぞく</div>
            <div className="text-xl font-black">{summary.maxCombo}</div>
          </div>
        </div>
        {summary.isNewRecord && (
          <p className="mt-2 inline-block rounded-full bg-sun px-3 py-1 text-sm font-black" data-testid="new-record">
            🏆 じこしんきろく！
          </p>
        )}
        {!summary.isNewRecord && save.highScores[summary.mode] > 0 && <p className="mt-2 text-xs font-bold text-ink-soft">さいこう {save.highScores[summary.mode]}てん</p>}
      </div>

      <Guide className="w-full">{rank.message}</Guide>

      {summary.wrongIds.length > 0 && (
        <div className="w-full rounded-3xl bg-white p-3 shadow-card">
          <h2 className="text-sm font-bold text-ink-soft">つぎは おぼえよう</h2>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {summary.wrongIds.map((id) => {
              const e = entryInfo(id)
              return (
                <li key={id} className="rounded-full bg-cream px-3 py-1 text-sm font-bold">
                  <Ruby text={e.name} kana={e.kana} />
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="flex w-full max-w-xs flex-col gap-2 pb-4">
        <Button size="lg" onClick={onReplay} data-testid="replay-button">
          もういちど！
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="sky" onClick={onModes} data-testid="modes-button">
            ほかのモード
          </Button>
          <Button variant="mint" onClick={onZukan} data-testid="result-zukan-button">
            📖 図鑑をみる
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onTitle} data-testid="title-button">
          タイトルへもどる
        </Button>
      </div>
      <Confetti burstKey={burst} />
    </div>
  )
}
