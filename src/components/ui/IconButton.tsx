import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useApp } from '../../app/AppContext'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
}

/** 44px 以上のタップ領域を持つアイコンボタン */
export function IconButton({ label, children, className = '', onClick, ...rest }: IconButtonProps) {
  const { play } = useApp()
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`btn-pop focus-ring inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-ink border-2 border-line ${className}`}
      onClick={(e) => {
        play('tap')
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
