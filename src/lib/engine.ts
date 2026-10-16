import { MODES } from '../app/modes'
import { titleFor } from '../data/titles'
import type { GameAction, GameState, GameSummary, ModeId, Question } from '../types'
import { calcPoints } from './scoring'

export function createGame(mode: ModeId, questions: Question[]): GameState {
  if (questions.length === 0) throw new Error('問題がありません')
  return {
    mode,
    questions,
    index: 0,
    phase: 'question',
    score: 0,
    combo: 0,
    maxCombo: 0,
    attemptsLeft: MODES[mode].attempts,
    hintUsed: false,
    wrongIds: [],
    removedChoices: [],
    lastResult: null,
    records: [],
  }
}

export const currentQuestion = (s: GameState): Question => s.questions[s.index]!

/** 純粋関数のゲーム状態遷移。UI はこれを dispatch するだけ */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'answer':
      return answer(state, action.id)
    case 'hint':
      return state.phase === 'question' && MODES[state.mode].hintAvailable && !state.hintUsed
        ? { ...state, hintUsed: true, removedChoices: action.removed ?? [] }
        : state
    case 'next':
      return next(state)
    case 'timeUp':
      return state.phase === 'finished' ? state : { ...state, phase: 'finished' }
  }
}

function answer(state: GameState, id: string): GameState {
  if (state.phase !== 'question') return state
  const q = currentQuestion(state)
  const attemptsUsed = MODES[state.mode].attempts - state.attemptsLeft + 1
  const correct = id === q.targetId

  if (correct) {
    const combo = state.hintUsed || attemptsUsed > 1 ? state.combo : state.combo + 1
    const points = calcPoints({ correct: true, attempt: attemptsUsed, combo, hintUsed: state.hintUsed })
    return {
      ...state,
      phase: 'feedback',
      score: state.score + points,
      combo,
      maxCombo: Math.max(state.maxCombo, combo),
      lastResult: { correct: true, targetId: q.targetId, answeredId: id, points, exhausted: true },
      records: [...state.records, { targetId: q.targetId, correct: true, attempts: attemptsUsed, hintUsed: state.hintUsed, points }],
    }
  }

  const attemptsLeft = state.attemptsLeft - 1
  const exhausted = attemptsLeft <= 0
  const wrongIds = state.wrongIds.includes(id) ? state.wrongIds : [...state.wrongIds, id]
  if (!exhausted) {
    return { ...state, attemptsLeft, wrongIds, lastResult: { correct: false, targetId: q.targetId, answeredId: id, points: 0, exhausted: false } }
  }
  return {
    ...state,
    phase: 'feedback',
    attemptsLeft,
    wrongIds,
    combo: 0,
    lastResult: { correct: false, targetId: q.targetId, answeredId: id, points: 0, exhausted: true },
    records: [...state.records, { targetId: q.targetId, correct: false, attempts: attemptsUsed, hintUsed: state.hintUsed, points: 0 }],
  }
}

function next(state: GameState): GameState {
  if (state.phase !== 'feedback') return state
  const nextIndex = state.index + 1
  if (nextIndex >= state.questions.length) return { ...state, phase: 'finished' }
  return {
    ...state,
    index: nextIndex,
    phase: 'question',
    attemptsLeft: MODES[state.mode].attempts,
    hintUsed: false,
    wrongIds: [],
    removedChoices: [],
    lastResult: null,
  }
}

export function summarize(state: GameState, previousHighScore: number): GameSummary {
  const correct = state.records.filter((r) => r.correct).length
  return {
    mode: state.mode,
    score: state.score,
    correct,
    answered: state.records.length,
    maxCombo: state.maxCombo,
    wrongIds: [...new Set(state.records.filter((r) => !r.correct).map((r) => r.targetId))],
    correctIds: [...new Set(state.records.filter((r) => r.correct).map((r) => r.targetId))],
    title: titleFor(state.mode, correct, state.score).title,
    isNewRecord: state.score > previousHighScore,
  }
}
