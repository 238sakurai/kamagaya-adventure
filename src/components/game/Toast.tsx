import { AnimatePresence, motion } from 'motion/react'

export function Toast({ message, tone = 'wrong' }: { message: string | null; tone?: 'wrong' | 'info' }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          role="status"
          aria-live="polite"
          data-testid="toast"
          className={`pointer-events-none absolute inset-x-0 top-2 z-20 mx-auto w-fit max-w-[92%] rounded-full px-4 py-2 text-center text-sm font-bold shadow-card ${tone === 'wrong' ? 'bg-wrong text-ink' : 'bg-white text-ink'}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
