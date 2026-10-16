import { getDistrict } from '../../data/districts'
import type { Question } from '../../types'
import { Button } from '../ui/Button'
import { Ruby } from '../ui/Ruby'

interface ChoiceGridProps {
  question: Question
  removed: string[]
  answered: string | null
  onChoose: (id: string) => void
}

export function ChoiceGrid({ question, removed, answered, onChoose }: ChoiceGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2" data-testid="choices" role="group" aria-label="こたえをえらぶ">
      {question.choices.map((id) => {
        const d = getDistrict(id)
        const isRemoved = removed.includes(id)
        return (
          <Button
            key={id}
            variant={answered === id ? 'sky' : 'secondary'}
            size="md"
            className="min-h-14 px-2 text-lg"
            disabled={isRemoved || answered !== null}
            onClick={() => onChoose(id)}
            data-code={id}
            aria-label={d.name}
          >
            {isRemoved ? <span className="text-ink-soft line-through">{d.name}</span> : <Ruby text={d.name} kana={d.kana} />}
          </Button>
        )
      })}
    </div>
  )
}
