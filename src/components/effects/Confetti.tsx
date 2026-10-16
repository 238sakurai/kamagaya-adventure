import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../app/AppContext'
import { createRng } from '../../lib/random'

const COLORS = ['#ffa726', '#ffe066', '#8dd9a5', '#b8e4ff', '#f1a7c8', '#c7b8f5']
const PIECES = 24
const LIFETIME_MS = 2200

/**
 * 紙吹雪。burstKey が変わるたびに 1 回だけ降り、終わったら DOM から消える。
 * 省電力モード・動きを減らす設定では簡易表示（短い「✨」）にする。
 */
export function Confetti({ burstKey }: { burstKey: number }) {
  const { effects } = useApp()
  const [activeKey, setActiveKey] = useState(0)

  useEffect(() => {
    if (burstKey === 0) return
    setActiveKey(burstKey)
    const id = window.setTimeout(() => setActiveKey(0), LIFETIME_MS)
    return () => window.clearTimeout(id)
  }, [burstKey])

  // 乱数は burst ごとに決定的（描画中に Math.random を呼ばない）
  const pieces = useMemo(() => {
    const rng = createRng(activeKey)
    return Array.from({ length: PIECES }, (_, i) => ({
      id: `${activeKey}-${i}`,
      x: 5 + rng() * 90,
      delay: rng() * 0.2,
      drift: (rng() - 0.5) * 100,
      rotate: rng() * 540 - 270,
      color: COLORS[i % COLORS.length]!,
      size: 8 + rng() * 6,
      duration: 1.6 + rng() * 0.4,
      round: i % 3 === 0,
    }))
  }, [activeKey])

  if (activeKey === 0) return null
  if (!effects) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-1/4 z-50 text-center text-4xl" aria-hidden="true">
        ✨
      </div>
    )
  }
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block will-change-transform"
          style={{ left: `${p.x}%`, width: p.size, height: p.size * (p.round ? 1 : 0.6), backgroundColor: p.color, borderRadius: p.round ? '50%' : 2 }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '100vh', x: p.drift, rotate: p.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}
