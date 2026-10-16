import type { ReactNode } from 'react'
import { CHARACTER } from '../../config/character'

interface GuideProps {
  children: ReactNode
  size?: 'sm' | 'md'
  className?: string
  testId?: string
}

/**
 * 案内役の吹き出し。
 * 公式画像の使用承認が得られるまでは、汎用の案内アイコン（方位磁針）を表示する。
 * かまたんに似せたキャラクターは描かない。
 */
export function Guide({ children, size = 'md', className = '', testId }: GuideProps) {
  const avatar = size === 'sm' ? 40 : 56
  return (
    <div className={`flex items-end gap-2 ${className}`} data-testid={testId}>
      <GuideAvatar size={avatar} />
      <div className="relative min-w-0 flex-1 rounded-3xl rounded-bl-md bg-white px-4 py-2.5 text-base font-bold leading-snug shadow-card" role="status" aria-live="polite">
        <span className="sr-only">{CHARACTER.name}：</span>
        {children}
      </div>
    </div>
  )
}

export function GuideAvatar({ size = 56 }: { size?: number }) {
  if (CHARACTER.imageSrc && CHARACTER.officialImageApproved) {
    return <img src={`${import.meta.env.BASE_URL}${CHARACTER.imageSrc}`} alt={CHARACTER.name} width={size} height={size} className="shrink-0 rounded-full object-contain" />
  }
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true" className="shrink-0">
      <circle cx="28" cy="28" r="26" fill="#fff4d6" stroke="#ffa726" strokeWidth="3" />
      <circle cx="28" cy="28" r="17" fill="#fff" stroke="#e5b56a" strokeWidth="2" />
      <path d="M28 13 L33 28 L28 43 L23 28 Z" fill="#ffa726" />
      <path d="M28 13 L33 28 L23 28 Z" fill="#e08a0b" />
      <circle cx="28" cy="28" r="3" fill="#453830" />
    </svg>
  )
}
