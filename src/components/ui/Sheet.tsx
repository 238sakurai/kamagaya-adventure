import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  testId?: string
}

/** 画面下から出るシート。Esc / 背景タップで閉じる */
export function Sheet({ open, onClose, title, children, testId }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          data-testid={testId}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-paper p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-card sm:rounded-[2rem] scrollbar-thin"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
