import type { District, Facility, Question, SchoolFilter } from '../types'
import { createRng, shuffle, type Rng } from './random'

export const QUESTIONS_PER_GAME = 10
export const CHOICE_COUNT = 4

export function filterSchools(schools: readonly Facility[], filter: SchoolFilter): Facility[] {
  return schools.filter((s) => (filter === 'all' ? true : s.category === filter))
}

/** ピンをタップして答える問題。pool から重複なく出題する（pool が少なければその数だけ） */
export function generatePinQuestions(pool: readonly Facility[], count: number, rng: Rng): Question[] {
  const pinIds = pool.map((f) => f.id)
  return shuffle(pool, rng)
    .slice(0, Math.min(count, pool.length))
    .map((f) => ({ kind: 'pin' as const, targetId: f.id, pinIds, choices: [] }))
}

/** 名前が似ている町（同じ漢字を含む）をまぎらわしい選択肢として優先する */
export function pickDistractors(target: District, all: readonly District[], n: number, rng: Rng): District[] {
  const others = all.filter((d) => d.id !== target.id)
  const chars = [...target.name.replace(/ケ/g, '')]
  const similar = others.filter((d) => chars.some((c) => d.name.includes(c)))
  const rest = others.filter((d) => !similar.includes(d))
  const picked = shuffle(similar, rng).slice(0, Math.min(n, similar.length, 2))
  const fill = shuffle(rest.concat(similar.filter((d) => !picked.includes(d))), rng)
  return [...picked, ...fill].slice(0, n)
}

/** 4 択で町名を答える問題 */
export function generateChoiceQuestions(pool: readonly District[], count: number, rng: Rng): Question[] {
  return shuffle(pool, rng)
    .slice(0, Math.min(count, pool.length))
    .map((d) => {
      const distractors = pickDistractors(d, pool, CHOICE_COUNT - 1, rng)
      return { kind: 'choice' as const, targetId: d.id, pinIds: [], choices: shuffle([d, ...distractors], rng).map((x) => x.id) }
    })
}

export interface ChallengePools {
  schools: readonly Facility[]
  facilities: readonly Facility[]
  districts: readonly District[]
}

/** タイムアタック用: 学校・施設・町名をまぜた長い問題列（時間切れまで進む） */
export function generateChallengeQuestions(pools: ChallengePools, rng: Rng, total = 60): Question[] {
  const seqs = [
    generatePinQuestions(pools.schools, pools.schools.length, rng),
    generateChoiceQuestions(pools.districts, pools.districts.length, rng),
    generatePinQuestions(pools.facilities, pools.facilities.length, rng),
  ]
  const out: Question[] = []
  const cursors = [0, 0, 0]
  let guard = 0
  while (out.length < total && guard++ < total * 4) {
    const k = Math.floor(rng() * seqs.length)
    const seq = seqs[k]!
    if (seq.length === 0) continue
    const q = seq[cursors[k]! % seq.length]!
    cursors[k]!++
    // 直前と同じ問題は避ける
    if (out.length > 0 && out[out.length - 1]!.targetId === q.targetId) continue
    out.push(q)
  }
  return out
}

/** 4 択のヒント: 不正解を 2 つ消す */
export function fiftyFifty(question: Question, rng: Rng): string[] {
  const wrong = question.choices.filter((c) => c !== question.targetId)
  return shuffle(wrong, rng).slice(0, 2)
}

export { createRng }
