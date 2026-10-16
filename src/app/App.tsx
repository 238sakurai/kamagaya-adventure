import { useCallback, useMemo, useRef, useState } from 'react'
import { debugOptionsFromLocation } from '../lib/random'
import { applySummary } from '../lib/storage'
import { AboutScreen } from '../screens/AboutScreen'
import { EncyclopediaScreen } from '../screens/EncyclopediaScreen'
import { ExploreScreen } from '../screens/ExploreScreen'
import { HowToScreen } from '../screens/HowToScreen'
import { ModeSelectScreen } from '../screens/ModeSelectScreen'
import { MySchoolScreen } from '../screens/MySchoolScreen'
import { QuizScreen } from '../screens/QuizScreen'
import { ResultScreen } from '../screens/ResultScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { TitleScreen } from '../screens/TitleScreen'
import type { GameSummary, ModeId, SchoolFilter } from '../types'
import { AppProvider, useApp } from './AppContext'

type Screen =
  | { name: 'title' }
  | { name: 'howto' }
  | { name: 'modes' }
  | { name: 'quiz'; mode: ModeId; schoolFilter: SchoolFilter; run: number }
  | { name: 'result'; summary: GameSummary }
  | { name: 'explore' }
  | { name: 'myschool' }
  | { name: 'settings' }
  | { name: 'about' }

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}

function Router() {
  const { geo, geoError, updateSave, play } = useApp()
  const [screen, setScreen] = useState<Screen>({ name: 'title' })
  /** 図鑑は今の画面の上に重ねて開く（クイズや探検の進行を失わないため） */
  const [zukan, setZukan] = useState<{ initialId: string | null } | null>(null)
  const debug = useMemo(() => (typeof window === 'undefined' ? {} : debugOptionsFromLocation(window.location.search)), [])
  const seed = debug.seed

  const runRef = useRef(0)
  const startMode = useCallback((mode: ModeId, schoolFilter: SchoolFilter) => {
    runRef.current += 1
    setScreen({ name: 'quiz', mode, schoolFilter, run: runRef.current })
  }, [])

  const finish = useCallback(
    (summary: GameSummary) => {
      updateSave((prev) => applySummary(prev, summary))
      if (summary.correctIds.length > 0) play('discover')
      setScreen({ name: 'result', summary })
    },
    [updateSave, play],
  )

  const openZukan = useCallback((initialId: string | null = null) => setZukan({ initialId }), [])
  const toTitle = useCallback(() => setScreen({ name: 'title' }), [])

  const loading = <p className="safe-pad text-center font-bold text-ink-soft">{geoError ? `地図を読み込めませんでした: ${geoError}` : '地図を じゅんびちゅう…'}</p>

  // 画面遷移のアニメーションは行わない（省電力・即応性を優先）
  return (
    <>
      <main className="min-h-dvh" key={screen.name === 'quiz' ? `quiz-${screen.run}` : screen.name} aria-hidden={zukan !== null} inert={zukan !== null}>
        {screen.name === 'title' && (
          <TitleScreen
            onPlay={() => setScreen({ name: 'modes' })}
            onExplore={() => setScreen({ name: 'explore' })}
            onZukan={() => openZukan()}
            onMySchool={() => setScreen({ name: 'myschool' })}
            onHowTo={() => setScreen({ name: 'howto' })}
            onSettings={() => setScreen({ name: 'settings' })}
            onAbout={() => setScreen({ name: 'about' })}
          />
        )}
        {screen.name === 'howto' && <HowToScreen onBack={toTitle} onPlay={() => setScreen({ name: 'modes' })} />}
        {screen.name === 'modes' && <ModeSelectScreen onSelect={startMode} onBack={toTitle} />}
        {screen.name === 'quiz' &&
          (geo ? (
            <QuizScreen
              geo={geo}
              mode={screen.mode}
              schoolFilter={screen.schoolFilter}
              seed={seed === undefined ? undefined : seed + screen.run}
              timeLimitOverride={debug.timeLimit}
              onFinish={finish}
              onQuit={toTitle}
              onOpenEncyclopedia={openZukan}
            />
          ) : (
            loading
          ))}
        {screen.name === 'result' && (
          <ResultScreen summary={screen.summary} onReplay={() => startMode(screen.summary.mode, 'all')} onModes={() => setScreen({ name: 'modes' })} onZukan={() => openZukan()} onTitle={toTitle} />
        )}
        {screen.name === 'explore' && (geo ? <ExploreScreen geo={geo} onBack={toTitle} onOpenEncyclopedia={openZukan} /> : loading)}
        {screen.name === 'myschool' && (geo ? <MySchoolScreen geo={geo} onBack={toTitle} onOpenEncyclopedia={openZukan} /> : loading)}
        {screen.name === 'settings' && <SettingsScreen onBack={toTitle} onMySchool={() => setScreen({ name: 'myschool' })} onAbout={() => setScreen({ name: 'about' })} />}
        {screen.name === 'about' && <AboutScreen onBack={toTitle} />}
      </main>
      {zukan && (
        <div className="fixed inset-0 z-30 overflow-y-auto bg-paper scrollbar-thin" data-testid="zukan-overlay" role="dialog" aria-modal="true" aria-label="かまがや図鑑">
          <EncyclopediaScreen onBack={() => setZukan(null)} initialId={zukan.initialId} />
        </div>
      )}
    </>
  )
}
