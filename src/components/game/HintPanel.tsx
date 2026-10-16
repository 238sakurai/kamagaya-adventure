import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

interface HintPanelProps {
  used: boolean
  hint: ReactNode
  onUse: () => void
}

export function HintPanel({ used, hint, onUse }: HintPanelProps) {
  if (!used) {
    return (
      <Button variant="cream" size="sm" onClick={onUse} data-testid="hint-button">
        💡 ヒント
      </Button>
    )
  }
  return (
    <div className="rounded-2xl bg-cream px-3 py-2 text-sm font-bold text-ink" data-testid="hint-text" role="status">
      💡 {hint}
    </div>
  )
}
