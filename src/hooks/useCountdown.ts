import { useEffect, useRef, useState } from 'react'
import { createStopwatch, pauseStopwatch, remainingFromStopwatch, startStopwatch, type StopwatchState } from '../lib/timer'
import { usePageVisible } from './usePageVisible'

/**
 * 一時停止できるカウントダウン。
 * running かつタブが表示中のときだけ進み、非表示中の時間は計測から除外する。
 * 0 になったら onExpire を一度だけ呼ぶ。タブ非表示中は setInterval も止める。
 */
export function useCountdown(durationMs: number, running: boolean, onExpire: () => void): { remainingMs: number; paused: boolean } {
  const visible = usePageVisible()
  const active = running && visible
  const watch = useRef<StopwatchState>(createStopwatch())
  const [remaining, setRemaining] = useState(durationMs)
  const expiredRef = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!active) {
      watch.current = pauseStopwatch(watch.current, Date.now())
      return
    }
    watch.current = startStopwatch(watch.current, Date.now())
    const tick = () => {
      const left = remainingFromStopwatch(watch.current, durationMs, Date.now())
      setRemaining(left)
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpireRef.current()
      }
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [active, durationMs])

  return { remainingMs: remaining, paused: running && !visible }
}
