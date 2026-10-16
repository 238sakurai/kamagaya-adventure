import type { FacilityCategory } from '../../types'
import { CATEGORY_INFO } from '../ui/CategoryBadge'

export type PinStyle = 'normal' | 'target' | 'correct' | 'wrong' | 'candidate' | 'discovered' | 'undiscovered' | 'dim' | 'hint'

const PIN_FILL: Partial<Record<PinStyle, string>> = {
  correct: '#58c78e',
  wrong: '#ffb56b',
  candidate: '#ffe066',
  undiscovered: '#b9b1a8',
}

export function pinColor(category: FacilityCategory, style: PinStyle): string {
  return PIN_FILL[style] ?? CATEGORY_INFO[category].hex
}

/** ピンの中の記号。色だけに頼らず形・文字でも区別する */
function Glyph({ category, hidden }: { category: FacilityCategory; hidden: boolean }) {
  if (hidden) {
    return (
      <text y="-13" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="#fff">
        ？
      </text>
    )
  }
  switch (category) {
    case 'elementary':
      return (
        <text y="-13" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="#fff">
          小
        </text>
      )
    case 'junior-high':
      return (
        <text y="-13" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="#fff">
          中
        </text>
      )
    case 'library':
      // 開いた本
      return (
        <g fill="#fff" stroke="none">
          <path d="M-6 -17 Q-1 -19 0 -16 Q1 -19 6 -17 L6 -9 Q1 -11 0 -8 Q-1 -11 -6 -9 Z" />
          <rect x="-0.6" y="-16" width="1.2" height="8" fill={CATEGORY_INFO.library.hex} />
        </g>
      )
    case 'children-center':
      // ボール
      return (
        <g fill="none" stroke="#fff" strokeWidth="1.6">
          <circle cx="0" cy="-13" r="5" />
          <path d="M-5 -13 Q0 -9 5 -13 M-3.5 -16.5 Q0 -13 3.5 -16.5" />
        </g>
      )
  }
}

interface PinShapeProps {
  category: FacilityCategory
  style: PinStyle
  hidden: boolean
  shape: 'drop' | 'square'
}

/** ピン本体。原点が刺さる位置。幅 ≒ 24px・高さ ≒ 30px（スケールは親が決める） */
export function PinShape({ category, style, hidden, shape }: PinShapeProps) {
  const fill = pinColor(category, style)
  const strokeWidth = style === 'target' || style === 'candidate' ? 3 : 2
  const stroke = style === 'candidate' ? '#e08a0b' : '#fff'
  return (
    <g>
      <ellipse cx="0" cy="1.5" rx="7" ry="3" fill="#453830" opacity="0.18" />
      {shape === 'drop' ? (
        <path className="pin-body" d="M0 0 C-7 -9 -11 -13 -11 -19 A11 11 0 1 1 11 -19 C11 -13 7 -9 0 0 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      ) : (
        <path className="pin-body" d="M0 0 L-6 -7 L-11 -7 Q-13 -7 -13 -9 L-13 -22 Q-13 -24 -11 -24 L11 -24 Q13 -24 13 -22 L13 -9 Q13 -7 11 -7 L6 -7 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      )}
      <Glyph category={category} hidden={hidden} />
      {style === 'correct' && (
        <text y="-32" textAnchor="middle" fontSize="14" fontWeight="700" fill="#2f9d66" className="text-halo">
          ★
        </text>
      )}
      {style === 'wrong' && (
        <text y="-30" textAnchor="middle" fontSize="14" fontWeight="700" fill="#d9842f" className="text-halo">
          ✕
        </text>
      )}
    </g>
  )
}

export const pinShapeFor = (category: FacilityCategory): 'drop' | 'square' => (category === 'junior-high' || category === 'children-center' ? 'square' : 'drop')
