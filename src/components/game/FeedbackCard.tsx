import { motion } from 'motion/react'
import { useApp } from '../../app/AppContext'
import { DISTRICT_BY_ID } from '../../data/districts'
import { FACILITY_BY_ID } from '../../data/facilities'
import { LINES, pickLine } from '../../data/lines'
import { entryInfo } from '../../lib/entries'
import type { LastResult } from '../../types'
import { Guide } from '../mascot/Guide'
import { Button } from '../ui/Button'
import { CategoryBadge } from '../ui/CategoryBadge'
import { OfficialSiteButton } from '../ui/ExternalLink'
import { Ruby } from '../ui/Ruby'

interface FeedbackCardProps {
  result: LastResult
  combo: number
  isLast: boolean
  showNext: boolean
  onNext: () => void
  onOpenEncyclopedia?: (id: string) => void
}

export function FeedbackCard({ result, combo, isLast, showNext, onNext, onOpenEncyclopedia }: FeedbackCardProps) {
  const { effects } = useApp()
  const target = entryInfo(result.targetId)
  const facility = FACILITY_BY_ID.get(result.targetId)
  const district = DISTRICT_BY_ID.get(result.targetId)
  const answered = result.answeredId !== result.targetId ? entryInfo(result.answeredId) : null
  const line = result.correct ? (combo >= 3 ? pickLine(LINES.combo, combo / 10) : pickLine(LINES.correct, result.points / 1000)) : pickLine(LINES.wrong, 0.1)
  return (
    <motion.div
      initial={effects ? { y: 24, opacity: 0, scale: 0.98 } : false}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={`rounded-3xl border-4 bg-white p-3 shadow-card ${result.correct ? 'border-correct' : 'border-wrong'}`}
      data-testid="feedback"
      data-correct={result.correct}
    >
      <Guide size="sm">
        <span className={result.correct ? 'text-correct-dark' : 'text-wrong-dark'}>{result.correct ? 'だいせいかい！' : 'おしい！もうちょっと！'}</span> {line}
      </Guide>
      <div className="mt-2 flex items-start gap-2">
        <CategoryBadge category={target.category} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-snug">
            {!result.correct && <span className="mr-1 text-sm text-ink-soft">せいかいは</span>}
            <Ruby text={target.name} kana={target.kana} className="text-lg" />
          </p>
          {answered && <p className="text-xs font-bold text-ink-soft">えらんだのは {answered.name}</p>}
          {facility && <p className="mt-1 text-xs text-ink-soft">{facility.address}</p>}
          {facility?.description && (
            <p className="mt-1 text-sm leading-relaxed" data-testid="trivia">
              {facility.description}
            </p>
          )}
          {district && (
            <p className="mt-1 text-sm leading-relaxed" data-testid="trivia">
              {district.chomeCount > 0 ? `丁目は${district.chomeCount}つまであるよ。` : '丁目はない町だよ。'}
              {district.hint ? ` ${district.hint}` : ''}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {facility?.officialUrl && <OfficialSiteButton href={facility.officialUrl} data-testid="feedback-official-link" />}
        {onOpenEncyclopedia && (
          <Button variant="mint" size="sm" onClick={() => onOpenEncyclopedia(result.targetId)} data-testid="feedback-zukan-button">
            📖 図鑑でくわしくみる
          </Button>
        )}
        {showNext && (
          <Button variant="primary" size="md" onClick={onNext} data-testid="next-button" autoFocus>
            {isLast ? 'けっかをみる' : 'つぎへ ▶'}
          </Button>
        )}
      </div>
    </motion.div>
  )
}
