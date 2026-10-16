/** 決定的な乱数生成器（mulberry32）。シードを渡すとテストや E2E で出題順を再現できる */
export type Rng = () => number

export function createRng(seed?: number): Rng {
  if (seed === undefined) return Math.random
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

export function pickOne<T>(items: readonly T[], rng: Rng = Math.random): T {
  if (items.length === 0) throw new Error('pickOne: empty array')
  return items[Math.floor(rng() * items.length)]!
}

export interface DebugOptions {
  /** 出題順を固定する乱数シード */
  seed?: number
  /** チャレンジモードの制限時間（秒）を上書きする */
  timeLimit?: number
}

function numberParam(params: URLSearchParams, key: string): number | undefined {
  const value = params.get(key)
  if (value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

/** URL クエリのテスト用オプション（?seed=1&timeLimit=5）。通常プレイでは未指定 */
export function debugOptionsFromLocation(search: string): DebugOptions {
  const params = new URLSearchParams(search)
  const timeLimit = numberParam(params, 'timeLimit')
  return {
    seed: numberParam(params, 'seed'),
    timeLimit: timeLimit !== undefined && timeLimit > 0 ? timeLimit : undefined,
  }
}

/** @deprecated debugOptionsFromLocation を使う */
export function seedFromLocation(search: string): number | undefined {
  return debugOptionsFromLocation(search).seed
}
