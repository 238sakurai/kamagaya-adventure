/** 正解の基本点 */
export const BASE_POINTS = 100
/** 連続正解ボーナス（2問目から 1 コンボごとに加算） */
export const COMBO_STEP = 20
/** コンボボーナスの上限 */
export const COMBO_MAX_BONUS = 100

export interface PointsInput {
  correct: boolean
  /** 何回目の回答で正解したか（1 始まり） */
  attempt: number
  /** この正解を含めた連続正解数 */
  combo: number
  hintUsed: boolean
}

/** 1問分の得点。ヒント使用時と2回目以降の正解はボーナス対象外（基本点のみ） */
export function calcPoints({ correct, attempt, combo, hintUsed }: PointsInput): number {
  if (!correct) return 0
  if (hintUsed || attempt > 1) return BASE_POINTS
  return BASE_POINTS + comboBonus(combo)
}

export function comboBonus(combo: number): number {
  if (combo < 2) return 0
  return Math.min(COMBO_MAX_BONUS, (combo - 1) * COMBO_STEP)
}

/** 正答率（0〜100 の整数）。0問なら 0 */
export function accuracy(correct: number, answered: number): number {
  if (answered <= 0) return 0
  return Math.round((correct / answered) * 100)
}
