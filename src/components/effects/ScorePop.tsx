import { AnimatePresence, motion } from 'motion/react'

/** 「+120」のように得点が飛び出す表示 */
export function ScorePop({ points, popKey }: { points: number; popKey: number }) {
  return (
    <AnimatePresence>
      {points > 0 && (
        <motion.span
          key={popKey}
          className="pointer-events-none absolute -top-3 right-0 text-lg font-black text-correct-dark"
          initial={{ opacity: 0, y: 8, scale: 0.6 }}
          animate={{ opacity: 1, y: -18, scale: 1.1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.6 }}
          aria-hidden="true"
        >
          +{points}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
