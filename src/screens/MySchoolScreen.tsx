import { useMemo } from 'react'
import { useApp } from '../app/AppContext'
import { KamagayaMap, type MapPin } from '../components/map/KamagayaMap'
import { Guide } from '../components/mascot/Guide'
import { Button } from '../components/ui/Button'
import { ExternalLink, OfficialSiteButton } from '../components/ui/ExternalLink'
import { Ruby } from '../components/ui/Ruby'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { ELEMENTARY_SCHOOLS, FACILITY_BY_ID } from '../data/facilities'
import { SCHOOL_DISTRICT_URL } from '../data/schools'
import { project } from '../lib/geo'
import { districtIdForTown, formatKm, nearbyFacilities } from '../lib/hints'
import type { GeoData } from '../types'

interface MySchoolScreenProps {
  geo: GeoData
  onBack: () => void
  onOpenEncyclopedia: (id: string) => void
}

export function MySchoolScreen({ geo, onBack, onOpenEncyclopedia }: MySchoolScreenProps) {
  const { save, setSettings, play } = useApp()
  const selectedId = save.settings.mySchoolId
  const school = selectedId ? FACILITY_BY_ID.get(selectedId) : undefined
  const nearbyLibraries = useMemo(() => (school ? nearbyFacilities(school, 'library', 2) : []), [school])
  const nearbyCenters = useMemo(() => (school ? nearbyFacilities(school, 'children-center', 2) : []), [school])

  const pins = useMemo<MapPin[]>(() => {
    if (!school) return []
    const list = [school, ...nearbyLibraries.map((n) => n.facility), ...nearbyCenters.map((n) => n.facility)]
    return list.map((f) => ({ id: f.id, point: project(geo.projection, f.longitude, f.latitude), category: f.category, label: f.name, ariaLabel: f.name }))
  }, [school, nearbyLibraries, nearbyCenters, geo.projection])

  const townId = school ? districtIdForTown(school.town) : null

  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-3" data-testid="myschool-screen">
      <ScreenHeader title="わたしの学校" onBack={onBack} />
      <Guide size="sm">きみの学校をえらんでね！ えらばなくても あそべるよ。</Guide>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="きみの学校">
        {ELEMENTARY_SCHOOLS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={selectedId === s.id}
            data-testid={`school-${s.id}`}
            className={`focus-ring min-h-10 rounded-full border-2 px-3 text-sm font-bold ${selectedId === s.id ? 'border-cat-elementary bg-cat-elementary text-white' : 'border-line bg-white text-ink'}`}
            onClick={() => {
              play('tap')
              setSettings({ mySchoolId: selectedId === s.id ? null : s.id })
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {school ? (
        <div className="flex flex-col gap-3 pb-4" data-testid="myschool-detail">
          <div className="h-56 overflow-hidden rounded-3xl bg-sky/30 shadow-card">
            <KamagayaMap
              geo={geo}
              pins={pins}
              pinStyles={{ [school.id]: 'candidate' }}
              pinLabels={[school.id]}
              districtStyles={townId ? { [townId]: 'selected' } : {}}
              focus={{ point: pins[0]!.point, scale: 3 }}
              zoomable
              ariaLabel={`${school.name}のまわりの地図`}
            />
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-card">
            <h2 className="text-2xl font-black">
              <Ruby text={school.name} kana={school.kana} />
            </h2>
            <p className="mt-1 text-sm text-ink-soft">{school.address}</p>
            <p className="mt-1 text-sm">
              町名: <span className="font-bold">{school.town}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {school.officialUrl && <OfficialSiteButton href={school.officialUrl} label="学校のホームページ" data-testid="myschool-official-link" />}
              <Button variant="mint" size="sm" onClick={() => onOpenEncyclopedia(school.id)}>
                📖 図鑑でみる
              </Button>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-card">
            <h3 className="text-base font-black">近くの図書館・児童センター</h3>
            <p className="text-[11px] text-ink-soft">学校からの直線距離で計算しています。通学区域とは関係ありません。</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {[...nearbyLibraries, ...nearbyCenters].map(({ facility, km }) => (
                <li key={facility.id} className="flex items-center justify-between gap-2 rounded-2xl bg-cream px-3 py-2">
                  <button type="button" className="focus-ring min-h-9 text-left font-bold underline-offset-2 hover:underline" onClick={() => onOpenEncyclopedia(facility.id)}>
                    {facility.category === 'library' ? '📖' : '🪁'} {facility.name}
                  </button>
                  <span className="shrink-0 text-xs text-ink-soft">{formatKm(km)}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="rounded-2xl bg-sky/40 px-3 py-2 text-[12px] leading-relaxed text-ink">
            このゲームの情報は学習用です。正式な通学区域・指定校は、鎌ケ谷市教育委員会の案内で確認してください。{' '}
            <ExternalLink href={SCHOOL_DISTRICT_URL} className="font-bold underline">
              通学区域について（市公式）↗
            </ExternalLink>
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-ink-soft">学校をえらぶと、地図と近くの施設が表示されるよ。えらんだ学校は この端末の中だけに保存されます。</p>
      )}
    </div>
  )
}
