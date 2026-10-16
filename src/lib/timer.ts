/** 表示用の秒数（切り上げ。残り 0.3 秒なら「1」） */
export function displaySeconds(ms: number): number {
  return Math.ceil(ms / 1000)
}

/** 残り時間がこの秒数以下になったら強調表示 */
export const URGENT_SECONDS = 10

export function isUrgent(ms: number): boolean {
  return ms > 0 && displaySeconds(ms) <= URGENT_SECONDS
}

/**
 * 一時停止できるストップウォッチの純粋な状態。
 * タブが非表示の間は pause して、その時間を計測から除外する。
 */
export interface StopwatchState {
  /** 停止中に積み上がった経過ミリ秒 */
  banked: number
  /** 動作中なら再開した時刻（ms）、停止中なら null */
  runningSince: number | null
}

export const createStopwatch = (): StopwatchState => ({ banked: 0, runningSince: null })

export function elapsedMs(s: StopwatchState, now: number): number {
  return s.banked + (s.runningSince === null ? 0 : Math.max(0, now - s.runningSince))
}

export function startStopwatch(s: StopwatchState, now: number): StopwatchState {
  return s.runningSince === null ? { ...s, runningSince: now } : s
}

export function pauseStopwatch(s: StopwatchState, now: number): StopwatchState {
  if (s.runningSince === null) return s
  return { banked: elapsedMs(s, now), runningSince: null }
}

export function remainingFromStopwatch(s: StopwatchState, durationMs: number, now: number): number {
  return Math.max(0, durationMs - elapsedMs(s, now))
}
