import { MODE_ORDER, MODES } from '../app/modes'
import { Guide } from '../components/mascot/Guide'
import { Button } from '../components/ui/Button'
import { ScreenHeader } from '../components/ui/ScreenHeader'

export function HowToScreen({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-3 pb-6" data-testid="howto-screen">
      <ScreenHeader title="あそびかた" onBack={onBack} />
      <Guide>地図の ピンや 町を タップして こたえるたん！ 正解すると 図鑑に とうろく されるたん。</Guide>
      <ul className="space-y-2">
        {MODE_ORDER.map((id) => (
          <li key={id} className="rounded-3xl bg-white p-3 shadow-card">
            <h2 className="font-black">
              {MODES[id].emoji} {MODES[id].title}
            </h2>
            <p className="text-sm text-ink-soft">{MODES[id].description}</p>
          </li>
        ))}
        <li className="rounded-3xl bg-white p-3 shadow-card">
          <h2 className="font-black">🧭 かまがや探検</h2>
          <p className="text-sm text-ink-soft">クイズではなく、自由に地図をタップして 学校や施設を見つけるモード。見つけたものは図鑑に登録されるよ。</p>
        </li>
      </ul>
      <div className="rounded-3xl bg-cream p-3 text-sm leading-relaxed">
        <p>・ 正解 100点。つづけて正解すると ボーナスが つくよ。</p>
        <p>・ ヒントを使うと ボーナスは なし。</p>
        <p>・ 地図は 2本指で 拡大・縮小、ドラッグで うごかせるよ。</p>
        <p>・ ピンが重なっていたら、タップすると自動で拡大するよ。</p>
      </div>
      <Button size="lg" onClick={onPlay} data-testid="howto-play">
        あそぶ！
      </Button>
    </div>
  )
}
