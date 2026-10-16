import type { ReactNode } from 'react'
import { IconButton } from './IconButton'

interface ScreenHeaderProps {
  title: ReactNode
  onBack?: () => void
  backLabel?: string
  right?: ReactNode
}

export function ScreenHeader({ title, onBack, backLabel = 'もどる', right }: ScreenHeaderProps) {
  return (
    <header className="flex w-full items-center gap-2">
      {onBack ? (
        <IconButton label={backLabel} onClick={onBack} data-testid="back-button">
          ←
        </IconButton>
      ) : (
        <span className="w-12" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-center text-xl font-black">{title}</h1>
      <div className="flex w-12 justify-end">{right}</div>
    </header>
  )
}
