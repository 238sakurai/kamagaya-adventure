import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useApp } from '../app/AppContext'
import { MODES } from '../app/modes'
import { Confetti } from '../components/effects/Confetti'
import { ChoiceGrid } from '../components/game/ChoiceGrid'
import { FeedbackCard } from '../components/game/FeedbackCard'
import { HintPanel } from '../components/game/HintPanel'
import { QuestionBanner } from '../components/game/QuestionBanner'
import { QuizHud } from '../components/game/QuizHud'
import { Toast } from '../components/game/Toast'
import { KamagayaMap, type DistrictStyle, type MapFocus, type MapPin } from '../components/map/KamagayaMap'
import type { PinStyle } from '../components/map/pins'
import { Button } from '../components/ui/Button'
import { CATEGORY_INFO } from '../components/ui/CategoryBadge'
import { Sheet } from '../components/ui/Sheet'
import { DISTRICTS } from '../data/districts'
import { FACILITY_BY_ID, PUBLIC_FACILITIES, SCHOOLS } from '../data/facilities'
import { useCountdown } from '../hooks/useCountdown'
import { createGame, currentQuestion, gameReducer, summarize } from '../lib/engine'
import { findDistrict, project } from '../lib/geo'
import { describePosition, districtIdForTown } from '../lib/hints'
import { createRng, fiftyFifty, filterSchools, generateChallengeQuestions, generateChoiceQuestions, generatePinQuestions, QUESTIONS_PER_GAME } from '../lib/quiz'
import { displaySeconds, isUrgent } from '../lib/timer'
import type { GameSummary, GeoData, ModeId, Question, SchoolFilter } from '../types'

interface QuizScreenProps {
  geo: GeoData
  mode: ModeId
  schoolFilter: SchoolFilter
  seed?: number
  /** テスト用: 制限時間（秒）の上書き */
  timeLimitOverride?: number
  onFinish: (summary: GameSummary) => void
  onQuit: () => void
  onOpenEncyclopedia: (id: string) => void
}

function buildQuestions(mode: ModeId, schoolFilter: SchoolFilter, seed?: number): Question[] {
  const rng = createRng(seed)
  switch (mode) {
    case 'school':
      return generatePinQuestions(filterSchools(SCHOOLS, schoolFilter), QUESTIONS_PER_GAME, rng)
    case 'facility':
      return generatePinQuestions(PUBLIC_FACILITIES, QUESTIONS_PER_GAME, rng)
    case 'district':
      return generateChoiceQuestions(DISTRICTS, QUESTIONS_PER_GAME, rng)
    case 'challenge':
      return generateChallengeQuestions({ schools: SCHOOLS, facilities: PUBLIC_FACILITIES, districts: DISTRICTS }, rng)
  }
}

export function QuizScreen({ geo, mode, schoolFilter, seed, timeLimitOverride, onFinish, onQuit, onOpenEncyclopedia }: QuizScreenProps) {
  const { play, save } = useApp()
  const config = MODES[mode]
  const rng = useMemo(() => createRng(seed === undefined ? undefined : seed + 1), [seed])
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createGame(mode, buildQuestions(mode, schoolFilter, seed)))
  const question = currentQuestion(state)
  const [candidate, setCandidate] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: 'wrong' | 'info' } | null>(null)
  const [confettiKey, setConfettiKey] = useState(0)
  const [answeredChoice, setAnsweredChoice] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const finishedRef = useRef(false)
  const toastTimer = useRef<number | null>(null)

  const showToast = useCallback((message: string, tone: 'wrong' | 'info' = 'wrong') => {
    setToast({ message, tone })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1600)
  }, [])
  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
  }, [])

  // --- タイマー（チャレンジ。タブ非表示中は止まる） ---
  const timeLimit = config.timeLimit === null ? null : (timeLimitOverride ?? config.timeLimit)
  const { remainingMs, paused } = useCountdown((timeLimit ?? 0) * 1000, timeLimit !== null && state.phase !== 'finished', () => dispatch({ type: 'timeUp' }))
  const shownRemaining = timeLimit !== null ? remainingMs : null
  const lastTickSecond = useRef<number | null>(null)
  useEffect(() => {
    if (shownRemaining === null || !isUrgent(shownRemaining)) return
    const sec = displaySeconds(shownRemaining)
    if (lastTickSecond.current !== sec) {
      lastTickSecond.current = sec
      play('tick')
    }
  }, [shownRemaining, play])

  // --- 終了処理 ---
  useEffect(() => {
    if (state.phase !== 'finished' || finishedRef.current) return
    finishedRef.current = true
    play('result')
    onFinish(summarize(state, save.highScores[mode]))
  }, [state, mode, onFinish, play, save.highScores])

  // --- 自動で次へ（チャレンジ） ---
  useEffect(() => {
    if (state.phase !== 'feedback' || config.autoAdvanceMs === null) return
    const id = window.setTimeout(() => dispatch({ type: 'next' }), config.autoAdvanceMs)
    return () => window.clearTimeout(id)
  }, [state.phase, state.index, config.autoAdvanceMs])

  useEffect(() => {
    setCandidate(null)
    setAnsweredChoice(null)
    setListOpen(false)
  }, [state.index])

  const answer = useCallback(
    (id: string) => {
      const correct = id === question.targetId
      dispatch({ type: 'answer', id })
      setCandidate(null)
      if (correct) {
        play(state.combo >= 2 && !state.hintUsed ? 'combo' : 'correct')
        setConfettiKey((k) => k + 1)
      } else {
        play('wrong')
      }
    },
    [question.targetId, state.combo, state.hintUsed, play],
  )

  /** 10 問モードでは「けってい」で確定、チャレンジでは即回答 */
  const confirmTap = mode !== 'challenge'

  const handleTapPin = useCallback(
    (id: string) => {
      if (state.phase !== 'question' || question.kind !== 'pin') return
      if (!confirmTap || candidate === id) {
        answer(id)
        return
      }
      play('tap')
      setCandidate(id)
    },
    [state.phase, question.kind, confirmTap, candidate, answer, play],
  )

  const handleTapDistrict = useCallback(() => {
    if (state.phase !== 'question' || question.kind !== 'pin') return
    showToast('ピンを タップしてね', 'info')
  }, [state.phase, question.kind, showToast])

  const handleAmbiguous = useCallback(() => showToast('ちかくに ピンが いくつか あるよ。拡大したから もういちど タップしてね', 'info'), [showToast])

  const handleChoose = useCallback(
    (id: string) => {
      if (state.phase !== 'question') return
      setAnsweredChoice(id)
      answer(id)
    },
    [state.phase, answer],
  )

  const handleHint = useCallback(() => {
    play('tap')
    if (question.kind === 'choice') dispatch({ type: 'hint', removed: fiftyFifty(question, rng) })
    else dispatch({ type: 'hint' })
  }, [question, rng, play])

  // --- 地図の表示 ---
  const pins = useMemo<MapPin[]>(() => {
    if (question.kind !== 'pin') return []
    const revealAll = state.phase === 'feedback'
    return question.pinIds.map((id) => {
      const f = FACILITY_BY_ID.get(id)!
      const reveal = revealAll && (id === question.targetId || id === state.lastResult?.answeredId)
      return {
        id,
        point: project(geo.projection, f.longitude, f.latitude),
        category: f.category,
        label: f.name,
        ariaLabel: reveal ? f.name : `${CATEGORY_INFO[f.category].label}のピン（${f.town}）`,
        hidden: !reveal,
      }
    })
  }, [question, state.phase, state.lastResult, geo.projection])

  const targetTownId = useMemo(() => {
    if (question.kind !== 'pin') return null
    return districtIdForTown(FACILITY_BY_ID.get(question.targetId)!.town)
  }, [question])

  const pinStyles = useMemo(() => {
    const s: Partial<Record<string, PinStyle>> = {}
    if (state.phase === 'question') {
      if (candidate) s[candidate] = 'candidate'
    } else if (state.lastResult) {
      if (!state.lastResult.correct) s[state.lastResult.answeredId] = 'wrong'
      s[question.targetId] = 'correct'
    }
    return s
  }, [state.phase, state.lastResult, candidate, question.targetId])

  const districtStyles = useMemo(() => {
    const s: Partial<Record<string, DistrictStyle>> = {}
    if (question.kind === 'choice') {
      if (state.phase === 'question') s[question.targetId] = 'target'
      else if (state.lastResult) {
        if (!state.lastResult.correct) s[state.lastResult.answeredId] = 'wrong'
        s[question.targetId] = 'correct'
      }
    } else if (state.phase === 'question' && state.hintUsed && targetTownId) {
      s[targetTownId] = 'hint'
    }
    return s
  }, [question, state.phase, state.lastResult, state.hintUsed, targetTownId])

  const pinLabels = useMemo(() => {
    if (state.phase !== 'feedback' || !state.lastResult) return 'none' as const
    const ids = [question.targetId]
    if (!state.lastResult.correct) ids.push(state.lastResult.answeredId)
    return ids
  }, [state.phase, state.lastResult, question.targetId])

  const districtLabels = useMemo(() => {
    if (question.kind === 'choice') return state.phase === 'feedback' ? [question.targetId, ...(state.lastResult && !state.lastResult.correct ? [state.lastResult.answeredId] : [])] : 'none'
    return state.phase === 'question' && state.hintUsed && targetTownId ? [targetTownId] : 'none'
  }, [question, state.phase, state.lastResult, state.hintUsed, targetTownId])

  // 町名問題は出題区域にズーム。ピン問題は回答後に正解へズーム
  const focus = useMemo<MapFocus | null>(() => {
    if (question.kind === 'choice') {
      const d = findDistrict(geo, question.targetId)
      return d ? { bbox: d.bbox, scale: 3.5 } : null
    }
    if (state.phase === 'feedback' && config.autoAdvanceMs === null) {
      const f = FACILITY_BY_ID.get(question.targetId)!
      return { point: project(geo.projection, f.longitude, f.latitude), scale: 2.6 }
    }
    return null
  }, [question, state.phase, geo, config.autoAdvanceMs])

  const hintText = useMemo(() => {
    if (question.kind === 'choice') return 'まぎらわしい こたえを 2つ けしたよ'
    const f = FACILITY_BY_ID.get(question.targetId)!
    const d = targetTownId ? findDistrict(geo, targetTownId) : undefined
    const pos = d ? describePosition(d.centroid, geo.viewBox) : ''
    return `「${f.town}」という町に あるよ${pos ? `（${pos}）` : ''}`
  }, [question, targetTownId, geo])

  const isLast = config.questionCount !== null && state.index + 1 >= state.questions.length
  const candidateFacility = candidate ? FACILITY_BY_ID.get(candidate) : null

  return (
    <div className="safe-pad mx-auto flex h-dvh w-full max-w-lg flex-col gap-2" data-testid="quiz-screen" data-mode={mode}>
      <QuizHud state={state} remainingMs={shownRemaining} paused={paused} onQuit={onQuit} />
      <QuestionBanner question={question} index={state.index} />

      <div className="relative min-h-0 flex-1">
        <KamagayaMap
          geo={geo}
          pins={pins}
          pinStyles={pinStyles}
          pinLabels={pinLabels}
          districtStyles={districtStyles}
          districtLabels={districtLabels}
          interactive={state.phase === 'question' && question.kind === 'pin'}
          zoomable
          onTapPin={handleTapPin}
          onTapDistrict={handleTapDistrict}
          onAmbiguousTap={handleAmbiguous}
          focus={focus}
          focusShiftY={state.phase === 'feedback' ? 0.25 : 0}
        />
        <Toast message={toast?.message ?? null} tone={toast?.tone} />
        {paused && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-paper/70 text-lg font-black" data-testid="paused">
            ⏸ いちじていし中
          </div>
        )}
        {state.combo >= 2 && state.phase === 'feedback' && state.lastResult?.correct && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-sm font-black text-ink shadow-pop-sm" data-testid="combo">
            {state.combo}れんぞく！
          </div>
        )}
        <AnimatePresence>
          {state.phase === 'feedback' && state.lastResult && (
            <div className="absolute inset-x-0 bottom-0 z-30 max-h-full overflow-y-auto p-1 scrollbar-thin">
              <FeedbackCard
                result={state.lastResult}
                combo={state.combo}
                isLast={isLast}
                showNext={config.autoAdvanceMs === null}
                onNext={() => dispatch({ type: 'next' })}
                onOpenEncyclopedia={config.autoAdvanceMs === null ? onOpenEncyclopedia : undefined}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {state.phase === 'question' && (
        <div className="flex flex-col gap-2">
          {question.kind === 'choice' ? (
            <>
              <ChoiceGrid question={question} removed={state.removedChoices} answered={answeredChoice} onChoose={handleChoose} />
              {config.hintAvailable && (
                <div className="flex justify-end">
                  <HintPanel used={state.hintUsed} hint={hintText} onUse={handleHint} />
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {config.hintAvailable ? <HintPanel used={state.hintUsed} hint={hintText} onUse={handleHint} /> : <p className="text-sm font-bold text-ink-soft">ピンを タップ！</p>}
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setListOpen(true)} data-testid="list-pick-button">
                  リストからえらぶ
                </Button>
              </div>
              {confirmTap && (
                <div className="flex shrink-0 items-center gap-2">
                  {candidateFacility ? (
                    <Button size="md" onClick={() => answer(candidate!)} data-testid="confirm-button" variant="primary">
                      ここで けってい！
                    </Button>
                  ) : (
                    <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-bold text-ink-soft">タップして えらんでね</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ピンを直接タップしにくい場合の代替 UI（名前は隠したまま、町名で選ぶ） */}
      <Sheet open={listOpen} onClose={() => setListOpen(false)} title="ピンをリストからえらぶ" testId="pin-list">
        <h2 className="mb-2 text-lg font-black">どのピンにする？</h2>
        <p className="mb-3 text-sm text-ink-soft">ピンがある町の名前で えらべるよ。</p>
        <ul className="grid grid-cols-2 gap-2">
          {pins.map((p) => {
            const f = FACILITY_BY_ID.get(p.id)!
            return (
              <li key={p.id}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    setListOpen(false)
                    if (!confirmTap) answer(p.id)
                    else setCandidate(p.id)
                  }}
                  data-pin-list={p.id}
                >
                  <span aria-hidden="true">{CATEGORY_INFO[f.category].emoji}</span>
                  {f.town}
                </Button>
              </li>
            )
          })}
        </ul>
      </Sheet>

      <Confetti burstKey={confettiKey} />
    </div>
  )
}
