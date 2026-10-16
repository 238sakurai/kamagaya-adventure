import { describe, expect, it } from 'vitest'
import { createGame, currentQuestion, gameReducer, summarize } from '../../src/lib/engine'
import { BASE_POINTS, COMBO_STEP } from '../../src/lib/scoring'
import type { Question } from '../../src/types'

const q = (id: string, choices: string[] = []): Question => ({ kind: choices.length ? 'choice' : 'pin', targetId: id, pinIds: ['a', 'b', 'c'], choices })

describe('engine', () => {
  it('正解で 100 点、連続正解でボーナス、称号が付く', () => {
    let s = createGame('school', [q('a'), q('b'), q('c')])
    s = gameReducer(s, { type: 'answer', id: 'a' })
    expect(s.phase).toBe('feedback')
    expect(s.score).toBe(BASE_POINTS)
    s = gameReducer(s, { type: 'next' })
    s = gameReducer(s, { type: 'answer', id: 'b' })
    expect(s.score).toBe(BASE_POINTS * 2 + COMBO_STEP)
    expect(s.combo).toBe(2)
    s = gameReducer(s, { type: 'next' })
    s = gameReducer(s, { type: 'answer', id: 'x' })
    expect(s.lastResult).toMatchObject({ correct: false, answeredId: 'x', targetId: 'c' })
    expect(s.combo).toBe(0)
    s = gameReducer(s, { type: 'next' })
    expect(s.phase).toBe('finished')
    const sum = summarize(s, 0)
    expect(sum).toMatchObject({ correct: 2, answered: 3, correctIds: ['a', 'b'], wrongIds: ['c'], isNewRecord: true, maxCombo: 2 })
  })

  it('ヒントを使うとボーナスなし、2 回は使えない', () => {
    let s = createGame('district', [q('a', ['a', 'b', 'c', 'd'])])
    s = gameReducer(s, { type: 'hint', removed: ['b', 'c'] })
    expect(s.hintUsed).toBe(true)
    expect(s.removedChoices).toEqual(['b', 'c'])
    s = gameReducer(s, { type: 'hint', removed: ['d'] })
    expect(s.removedChoices).toEqual(['b', 'c'])
    s = gameReducer(s, { type: 'answer', id: 'a' })
    expect(s.score).toBe(BASE_POINTS)
    expect(s.combo).toBe(0)
  })

  it('チャレンジではヒント不可、timeUp で終了', () => {
    let s = createGame('challenge', [q('a'), q('b')])
    s = gameReducer(s, { type: 'hint' })
    expect(s.hintUsed).toBe(false)
    s = gameReducer(s, { type: 'answer', id: 'a' })
    s = gameReducer(s, { type: 'timeUp' })
    expect(s.phase).toBe('finished')
    expect(summarize(s, 500)).toMatchObject({ correct: 1, answered: 1, isNewRecord: false })
  })

  it('回答後は再回答できない', () => {
    let s = createGame('school', [q('a')])
    s = gameReducer(s, { type: 'answer', id: 'a' })
    const again = gameReducer(s, { type: 'answer', id: 'b' })
    expect(again).toBe(s)
    expect(currentQuestion(s).targetId).toBe('a')
  })
})
