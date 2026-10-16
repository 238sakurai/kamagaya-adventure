import { describe, expect, it } from 'vitest'
import { createStopwatch, elapsedMs, pauseStopwatch, remainingFromStopwatch, startStopwatch, displaySeconds, isUrgent } from '../../src/lib/timer'

describe('timer', () => {
  it('一時停止中の時間は計測されない', () => {
    let s = createStopwatch()
    s = startStopwatch(s, 1000)
    expect(elapsedMs(s, 1500)).toBe(500)
    s = pauseStopwatch(s, 2000)
    expect(elapsedMs(s, 9000)).toBe(1000)
    s = startStopwatch(s, 10000)
    expect(elapsedMs(s, 10500)).toBe(1500)
    expect(remainingFromStopwatch(s, 60000, 10500)).toBe(58500)
    expect(remainingFromStopwatch(s, 1000, 10500)).toBe(0)
  })

  it('表示用の秒数と残りわずか判定', () => {
    expect(displaySeconds(300)).toBe(1)
    expect(displaySeconds(60000)).toBe(60)
    expect(isUrgent(10000)).toBe(true)
    expect(isUrgent(10001)).toBe(false)
    expect(isUrgent(0)).toBe(false)
  })
})
