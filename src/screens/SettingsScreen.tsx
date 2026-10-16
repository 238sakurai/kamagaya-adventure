import { useState } from 'react'
import { useApp } from '../app/AppContext'
import { Button } from '../components/ui/Button'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Sheet } from '../components/ui/Sheet'

interface SettingsScreenProps {
  onBack: () => void
  onMySchool: () => void
  onAbout: () => void
}

function Toggle({ label, description, checked, onChange, testId }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void; testId: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-card">
      <span>
        <span className="block text-base font-black">{label}</span>
        <span className="block text-xs text-ink-soft">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        data-testid={testId}
        className={`focus-ring relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? 'bg-correct' : 'bg-line'}`}
        onClick={() => onChange(!checked)}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </label>
  )
}

export function SettingsScreen({ onBack, onMySchool, onAbout }: SettingsScreenProps) {
  const { save, setSettings, resetSave, play } = useApp()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-3" data-testid="settings-screen">
      <ScreenHeader title="せってい" onBack={onBack} />
      <Toggle label="効果音" description="正解やタップの音" checked={save.settings.sound} onChange={(v) => setSettings({ sound: v })} testId="setting-sound" />
      <Toggle
        label="省電力モード"
        description="紙吹雪やゆれる演出をへらして、電池を長もちさせます。地図やクイズはそのまま遊べます。"
        checked={save.settings.powerSave}
        onChange={(v) => {
          play('tap')
          setSettings({ powerSave: v })
        }}
        testId="setting-powersave"
      />
      <div className="rounded-3xl bg-white p-4 shadow-card">
        <h2 className="text-base font-black">わたしの学校</h2>
        <p className="text-xs text-ink-soft">えらんだ学校は この端末の中だけに保存され、外部には送られません。</p>
        <Button variant="sky" size="sm" className="mt-2" onClick={onMySchool}>
          学校をえらぶ
        </Button>
      </div>
      <div className="rounded-3xl bg-white p-4 shadow-card">
        <h2 className="text-base font-black">データをけす</h2>
        <p className="text-xs text-ink-soft">ハイスコア・図鑑・設定を すべて消します。もとにもどせません。</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => setConfirm(true)} data-testid="reset-button">
          セーブデータを けす
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onAbout}>
        このゲームについて
      </Button>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="データをけす">
        <h2 className="text-lg font-black">ほんとうに けしますか？</h2>
        <p className="mt-1 text-sm text-ink-soft">図鑑の発見やハイスコアが すべて消えます。</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            やめる
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              resetSave()
              setConfirm(false)
            }}
            data-testid="reset-confirm"
          >
            けす
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
