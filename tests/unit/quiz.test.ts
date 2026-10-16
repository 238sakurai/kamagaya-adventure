import { describe, expect, it } from 'vitest'
import { DISTRICTS, PUBLIC_FACILITIES, SCHOOLS } from '../../src/data/facilities'
import { createRng } from '../../src/lib/random'
import { fiftyFifty, filterSchools, generateChallengeQuestions, generateChoiceQuestions, generatePinQuestions, pickDistractors, QUESTIONS_PER_GAME } from '../../src/lib/quiz'

describe('quiz generation', () => {
  it('学校 10 問は重複なし、全 14 校がピン候補', () => {
    const qs = generatePinQuestions(SCHOOLS, QUESTIONS_PER_GAME, createRng(1))
    expect(qs).toHaveLength(10)
    expect(new Set(qs.map((q) => q.targetId)).size).toBe(10)
    for (const q of qs) {
      expect(q.kind).toBe('pin')
      expect(q.pinIds).toHaveLength(14)
      expect(q.pinIds).toContain(q.targetId)
    }
  })

  it('小学校だけなら 9 問、中学校だけなら 5 問（重複出題しない）', () => {
    expect(generatePinQuestions(filterSchools(SCHOOLS, 'elementary'), QUESTIONS_PER_GAME, createRng(2))).toHaveLength(9)
    expect(generatePinQuestions(filterSchools(SCHOOLS, 'junior-high'), QUESTIONS_PER_GAME, createRng(2))).toHaveLength(5)
  })

  it('施設 10 問は図書館・児童センター 12 件から', () => {
    const qs = generatePinQuestions(PUBLIC_FACILITIES, QUESTIONS_PER_GAME, createRng(3))
    expect(qs).toHaveLength(10)
    for (const q of qs) expect(q.pinIds).toHaveLength(12)
  })

  it('町名 4 択は正解を含む 4 つの異なる選択肢', () => {
    const qs = generateChoiceQuestions(DISTRICTS, QUESTIONS_PER_GAME, createRng(4))
    expect(qs).toHaveLength(10)
    expect(new Set(qs.map((q) => q.targetId)).size).toBe(10)
    for (const q of qs) {
      expect(q.kind).toBe('choice')
      expect(q.choices).toHaveLength(4)
      expect(new Set(q.choices).size).toBe(4)
      expect(q.choices).toContain(q.targetId)
    }
  })

  it('まぎらわしい選択肢（同じ漢字を含む町）を優先する', () => {
    const target = DISTRICTS.find((d) => d.name === '鎌ケ谷')!
    const picks = pickDistractors(target, DISTRICTS, 3, createRng(5))
    expect(picks.filter((d) => d.name.includes('鎌')).length).toBeGreaterThanOrEqual(2)
  })

  it('fiftyFifty は不正解を 2 つ消す', () => {
    const q = generateChoiceQuestions(DISTRICTS, 1, createRng(6))[0]!
    const removed = fiftyFifty(q, createRng(7))
    expect(removed).toHaveLength(2)
    expect(removed).not.toContain(q.targetId)
  })

  it('チャレンジは種類をまぜて、同じ問題が連続しない', () => {
    const qs = generateChallengeQuestions({ schools: SCHOOLS, facilities: PUBLIC_FACILITIES, districts: DISTRICTS }, createRng(8), 60)
    expect(qs.length).toBe(60)
    expect(qs.some((q) => q.kind === 'pin')).toBe(true)
    expect(qs.some((q) => q.kind === 'choice')).toBe(true)
    for (let i = 1; i < qs.length; i++) expect(qs[i]!.targetId).not.toBe(qs[i - 1]!.targetId)
  })

  it('同じシードなら同じ出題順', () => {
    const a = generatePinQuestions(SCHOOLS, 10, createRng(42)).map((q) => q.targetId)
    const b = generatePinQuestions(SCHOOLS, 10, createRng(42)).map((q) => q.targetId)
    expect(a).toEqual(b)
  })
})
