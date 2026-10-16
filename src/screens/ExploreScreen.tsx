import { useCallback, useMemo, useState } from 'react'
import { useApp } from '../app/AppContext'
import { Confetti } from '../components/effects/Confetti'
import { EntryDetail } from '../components/encyclopedia/EntryDetail'
import { Toast } from '../components/game/Toast'
import { KamagayaMap, type DistrictStyle, type MapPin } from '../components/map/KamagayaMap'
import type { PinStyle } from '../components/map/pins'
import { Guide } from '../components/mascot/Guide'
import { Button } from '../components/ui/Button'
import { CATEGORY_INFO } from '../components/ui/CategoryBadge'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Sheet } from '../components/ui/Sheet'
import { DISTRICTS } from '../data/districts'
import { ALL_ENTRY_IDS, FACILITIES } from '../data/facilities'
import { LINES, pickLine } from '../data/lines'
import { project } from '../lib/geo'
import { applyDiscovery, isDiscovered } from '../lib/storage'
import type { EntryCategory, GeoData } from '../types'

interface ExploreScreenProps {
  geo: GeoData
  onBack: () => void
  onOpenEncyclopedia: (id: string) => void
}

const LAYERS: EntryCategory[] = ['elementary', 'junior-high', 'library', 'children-center', 'district']

export function ExploreScreen({ geo, onBack, onOpenEncyclopedia }: ExploreScreenProps) {
  const { save, updateSave, play } = useApp()
  const [layers, setLayers] = useState<Record<EntryCategory, boolean>>({ elementary: true, 'junior-high': true, library: true, 'children-center': true, district: true })
  const [selected, setSelected] = useState<string | null>(null)
  const [justFound, setJustFound] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const discoveredCount = ALL_ENTRY_IDS.filter((id) => isDiscovered(save, id)).length

  const pins = useMemo<MapPin[]>(
    () =>
      FACILITIES.filter((f) => layers[f.category]).map((f) => {
        const found = isDiscovered(save, f.id)
        return { id: f.id, point: project(geo.projection, f.longitude, f.latitude), category: f.category, label: f.name, ariaLabel: found ? f.name : `まだ見つけていない${CATEGORY_INFO[f.category].label}（${f.town}）`, hidden: !found }
      }),
    [layers, save, geo.projection],
  )

  const pinStyles = useMemo(() => {
    const s: Partial<Record<string, PinStyle>> = {}
    for (const p of pins) s[p.id] = isDiscovered(save, p.id) ? 'normal' : 'undiscovered'
    if (selected) s[selected] = 'candidate'
    return s
  }, [pins, save, selected])

  const districtStyles = useMemo(() => {
    const s: Partial<Record<string, DistrictStyle>> = {}
    if (!layers.district) {
      for (const d of DISTRICTS) s[d.id] = 'dim'
      return s
    }
    for (const d of DISTRICTS) if (!isDiscovered(save, d.id)) s[d.id] = 'undiscovered'
    if (selected?.startsWith('town-')) s[selected] = 'selected'
    return s
  }, [layers.district, save, selected])

  const districtLabels = useMemo(() => (layers.district ? DISTRICTS.filter((d) => isDiscovered(save, d.id)).map((d) => d.id) : 'none'), [layers.district, save])

  const discover = useCallback(
    (id: string) => {
      const already = isDiscovered(save, id)
      updateSave((prev) => applyDiscovery(prev, id))
      setSelected(id)
      setJustFound(!already)
      if (!already) {
        play('discover')
        setConfettiKey((k) => k + 1)
      } else {
        play('tap')
      }
    },
    [save, updateSave, play],
  )

  const handleTapDistrict = useCallback(
    (id: string | null) => {
      if (!id) return
      if (!layers.district) {
        setToast('町名レイヤーが オフだよ')
        window.setTimeout(() => setToast(null), 1400)
        return
      }
      discover(id)
    },
    [layers.district, discover],
  )

  return (
    <div className="safe-pad mx-auto flex h-dvh w-full max-w-lg flex-col gap-2" data-testid="explore-screen">
      <ScreenHeader title="かまがや探検" onBack={onBack} right={<span className="text-xs font-bold text-ink-soft" data-testid="explore-count">{discoveredCount}/{ALL_ENTRY_IDS.length}</span>} />
      <Guide size="sm">地図を タップして、学校や施設を はっけんしよう！ 「？」は まだ 見つけていない場所だよ。</Guide>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="表示するもの">
        {LAYERS.map((c) => (
          <button
            key={c}
            type="button"
            className={`focus-ring inline-flex min-h-9 items-center gap-1 rounded-full border-2 px-2.5 text-xs font-bold ${layers[c] ? 'text-white' : 'border-line bg-white text-ink-soft'}`}
            style={layers[c] ? { backgroundColor: CATEGORY_INFO[c].hex, borderColor: CATEGORY_INFO[c].hex } : undefined}
            aria-pressed={layers[c]}
            data-testid={`layer-${c}`}
            onClick={() => {
              play('tap')
              setLayers((l) => ({ ...l, [c]: !l[c] }))
            }}
          >
            <span aria-hidden="true">{CATEGORY_INFO[c].emoji}</span>
            {CATEGORY_INFO[c].label}
          </button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1">
        <KamagayaMap
          geo={geo}
          pins={pins}
          pinStyles={pinStyles}
          pinLabels="all"
          districtStyles={districtStyles}
          districtLabels={districtLabels}
          colorDistricts
          showAreas={layers.district}
          interactive
          zoomable
          onTapPin={discover}
          onTapDistrict={handleTapDistrict}
        />
        <Toast message={toast} tone="info" />
      </div>
      <Sheet open={selected !== null} onClose={() => setSelected(null)} title="はっけん" testId="discovery-sheet">
        {selected && (
          <>
            {justFound && (
              <Guide size="sm" className="mb-3" testId="discovery-banner">
                <span className="text-correct-dark">はっけん！</span> {pickLine(LINES.discover, discoveredCount / 100)}
              </Guide>
            )}
            <EntryDetail id={selected} discovered />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="mint" size="sm" onClick={() => onOpenEncyclopedia(selected)} data-testid="discovery-zukan-button">
                📖 図鑑でみる
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>
                とじる
              </Button>
            </div>
          </>
        )}
      </Sheet>
      <Confetti burstKey={confettiKey} />
    </div>
  )
}
