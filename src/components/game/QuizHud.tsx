import { useApp } from '../../app/AppContext'
import { MODES } from '../../app/modes'
import { displaySeconds, isUrgent } from '../../lib/timer'
import type { GameState } from '../../types'
import { ScorePop } from '../effects/ScorePop'
import { IconButton } from '../ui/IconButton'

interface QuizHudProps {
  state: GameState
  remainingMs: number | null
  paused?: boolean
  onQuit: () => void
}

export function QuizHud({ state, remainingMs, paused = false, onQuit }: QuizHudProps) {
  const { save } = useApp()
  const config = MODES[state.mode]
  const total = state.questions.length
  const progress = config.questionCount === null ? null : `${Math.min(state.index + 1, total)}/${total}`
  const lastPoints = state.lastResult?.correct ? state.lastResult.points : 0
  return (
    <div className="flex items-center gap-2" data-testid="quiz-hud">
      <IconButton label="やめる" onClick={onQuit} data-testid="quit-button">
        ✕
      </IconButton>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-ink-soft">
          {config.emoji} {config.title}
        </div>
        {progress && (
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/80" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={state.index + 1} aria-label={`${total}もん中 ${state.index + 1}もんめ`}>
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${((state.index + (state.phase === 'feedback' ? 1 : 0)) / total) * 100}%` }} />
          </div>
        )}
      </div>
      {remainingMs !== null && (
        <div
          className={`rounded-full px-3 py-1 text-lg font-black tabular-nums ${isUrgent(remainingMs) ? 'bg-wrong text-ink' : 'bg-white text-ink'}`}
          data-testid="timer"
          aria-live="off"
          aria-label={`のこり ${displaySeconds(remainingMs)} びょう`}
        >
          {paused ? '⏸' : '⏱'} {displaySeconds(remainingMs)}
        </div>
      )}
      <div className="relative rounded-full bg-white px-3 py-1 text-right text-lg font-black tabular-nums" data-testid="score" aria-label={`スコア ${state.score} てん`}>
        {state.score}
        <span className="ml-0.5 text-xs font-bold text-ink-soft">てん</span>
        <ScorePop points={lastPoints} popKey={state.index * 10 + (state.phase === 'feedback' ? 1 : 0)} />
        {save.highScores[state.mode] > 0 && <div className="text-[10px] font-bold leading-none text-ink-soft">さいこう {save.highScores[state.mode]}</div>}
      </div>
    </div>
  )
}
