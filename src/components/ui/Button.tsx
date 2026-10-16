import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useApp } from '../../app/AppContext'

type Variant = 'primary' | 'secondary' | 'mint' | 'sky' | 'ghost' | 'correct' | 'cream'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  silent?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-ink',
  secondary: 'bg-white text-ink border-2 border-line',
  mint: 'bg-mint text-ink',
  sky: 'bg-sky text-ink',
  cream: 'bg-cream text-ink',
  ghost: 'bg-transparent text-ink-soft shadow-none',
  correct: 'bg-correct text-ink',
}

const SIZES: Record<Size, string> = {
  sm: 'min-h-11 px-4 text-base rounded-2xl',
  md: 'min-h-12 px-5 text-lg rounded-3xl',
  lg: 'min-h-14 px-7 text-xl rounded-full',
}

/** 押し込み表現は CSS（.btn-pop）だけで行い、JS アニメーションは使わない */
export function Button({ variant = 'primary', size = 'md', className = '', children, onClick, silent, ...rest }: ButtonProps) {
  const { play } = useApp()
  return (
    <button
      type="button"
      className={`btn-pop focus-ring inline-flex items-center justify-center gap-2 font-bold leading-tight ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      onClick={(e) => {
        if (!silent) play('tap')
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
