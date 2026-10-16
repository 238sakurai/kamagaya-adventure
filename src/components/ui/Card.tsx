import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  tone?: 'white' | 'cream' | 'mint' | 'sky'
}

const TONES = {
  white: 'bg-white',
  cream: 'bg-cream',
  mint: 'bg-mint',
  sky: 'bg-sky',
}

export function Card({ children, tone = 'white', className = '', ...rest }: CardProps) {
  return (
    <div className={`rounded-3xl shadow-card ${TONES[tone]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
