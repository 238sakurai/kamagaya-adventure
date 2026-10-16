import { entryInfo } from '../../lib/entries'
import type { Question } from '../../types'
import { Guide } from '../mascot/Guide'
import { Ruby } from '../ui/Ruby'

interface QuestionBannerProps {
  question: Question
  index: number
}

export function QuestionBanner({ question, index }: QuestionBannerProps) {
  const target = entryInfo(question.targetId)
  return (
    <div data-testid="question" data-target={question.targetId} data-kind={question.kind}>
      <Guide size="sm" testId="question-text">
        <span className="mr-1 rounded-full bg-cream px-2 py-0.5 text-xs font-bold text-ink-soft">Q{index + 1}</span>
        {question.kind === 'pin' ? (
          <>
            <Ruby text={target.name} kana={target.kana} className="text-primary-dark" />
            は どこかな？
          </>
        ) : (
          <>ここは 何という町かな？</>
        )}
      </Guide>
    </div>
  )
}
