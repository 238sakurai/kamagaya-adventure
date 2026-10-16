import { useApp } from '../app/AppContext'
import { KamagayaMap } from '../components/map/KamagayaMap'
import { Guide } from '../components/mascot/Guide'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { ALL_ENTRY_IDS } from '../data/facilities'
import { LINES, pickLine } from '../data/lines'
import { isDiscovered } from '../lib/storage'

interface TitleScreenProps {
  onPlay: () => void
  onExplore: () => void
  onZukan: () => void
  onMySchool: () => void
  onHowTo: () => void
  onSettings: () => void
  onAbout: () => void
}

export function TitleScreen({ onPlay, onExplore, onZukan, onMySchool, onHowTo, onSettings, onAbout }: TitleScreenProps) {
  const { geo, geoError, save, setSettings } = useApp()
  const discoveredCount = ALL_ENTRY_IDS.filter((id) => isDiscovered(save, id)).length
  const sound = save.settings.sound

  return (
    <div className="safe-pad relative mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center gap-3" data-testid="title-screen">
      <div className="flex w-full items-center justify-between pt-1">
        <IconButton label="このゲームについて" onClick={onAbout} data-testid="about-button">
          ℹ️
        </IconButton>
        <div className="flex gap-2">
          <IconButton label={sound ? '音をけす' : '音をだす'} onClick={() => setSettings({ sound: !sound })} aria-pressed={sound} data-testid="sound-toggle">
            {sound ? '🔊' : '🔇'}
          </IconButton>
          <IconButton label="せってい" onClick={onSettings} data-testid="settings-button">
            ⚙️
          </IconButton>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-[2rem] font-black leading-tight text-primary-dark sm:text-5xl">
          <span className="block text-xl text-ink sm:text-2xl">かまたんの</span>
          <span className="block">かまがや大冒険！</span>
        </h1>
        <p className="mt-1 inline-block rounded-full bg-cream px-4 py-1 text-sm font-bold text-ink shadow-pop-sm">学校・まち・施設をさがそう！</p>
      </div>

      <div className="relative h-[34vh] min-h-[200px] w-full max-w-sm">
        {geo ? (
          <KamagayaMap geo={geo} colorDistricts showAreas={false} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-[2rem] bg-sky/30 text-sm font-bold text-ink-soft" aria-live="polite">
            {geoError ? `地図を読み込めませんでした: ${geoError}` : '地図を じゅんびちゅう…'}
          </div>
        )}
      </div>

      <Guide className="w-full max-w-sm" testId="title-guide">
        {pickLine(LINES.title, (discoveredCount % 2) / 2)}
      </Guide>

      <div className="flex w-full max-w-xs flex-col gap-2.5 pb-2">
        <Button size="lg" onClick={onPlay} disabled={!geo} className="w-full text-2xl" data-testid="play-button">
          クイズであそぶ！
        </Button>
        <Button variant="mint" size="md" onClick={onExplore} disabled={!geo} className="w-full" data-testid="explore-button">
          🧭 かまがや探検
        </Button>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="sky" onClick={onZukan} data-testid="zukan-button" className="relative whitespace-nowrap">
            📖 かまがや図鑑
            {discoveredCount > 0 && (
              <span className="absolute -right-1 -top-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold shadow-pop-sm">
                {discoveredCount}/{ALL_ENTRY_IDS.length}
              </span>
            )}
          </Button>
          <Button variant="cream" onClick={onMySchool} data-testid="myschool-button" className="whitespace-nowrap">
            🏫 わたしの学校
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onHowTo} data-testid="howto-button">
          あそびかた
        </Button>
      </div>

      <footer className="mt-auto pb-1 text-center text-[11px] leading-relaxed text-ink-soft">
        このゲームは鎌ケ谷市の公式事業ではない、非公式の地域学習ゲームです。
        <br />
        地図: 国土数値情報（国土交通省）・令和2年国勢調査 小地域境界（総務省統計局）を加工
      </footer>
    </div>
  )
}
