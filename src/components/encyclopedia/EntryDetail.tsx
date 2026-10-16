import { useMemo } from 'react'
import { useApp } from '../../app/AppContext'
import { DISTRICT_BY_ID, DISTRICT_SOURCE } from '../../data/districts'
import { FACILITY_BY_ID } from '../../data/facilities'
import { findDistrict, project } from '../../lib/geo'
import { describePosition } from '../../lib/hints'
import { KamagayaMap, type MapPin } from '../map/KamagayaMap'
import { CATEGORY_INFO, CategoryBadge } from '../ui/CategoryBadge'
import { ExternalLink, OfficialSiteButton } from '../ui/ExternalLink'
import { Ruby } from '../ui/Ruby'
import { EntryPhoto } from './EntryPhoto'

interface EntryDetailProps {
  id: string
  discovered: boolean
}

const KANJI_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/** 図鑑の詳細。未発見でも公式サイトには行けるが、紹介文は隠す */
export function EntryDetail({ id, discovered }: EntryDetailProps) {
  const { geo } = useApp()
  const facility = FACILITY_BY_ID.get(id)
  const district = DISTRICT_BY_ID.get(id)
  const geoDistrict = geo && district ? findDistrict(geo, id) : undefined

  const pins = useMemo<MapPin[]>(() => {
    if (!geo || !facility) return []
    return [{ id: facility.id, point: project(geo.projection, facility.longitude, facility.latitude), category: facility.category, label: facility.name, ariaLabel: facility.name, hidden: !discovered }]
  }, [geo, facility, discovered])

  const name = facility?.name ?? district?.name ?? ''
  const kana = facility?.kana ?? district?.kana ?? ''
  const category = facility?.category ?? 'district'
  const info = CATEGORY_INFO[category]
  const firstPin = pins[0]
  const photo = facility?.photo ?? district?.photo

  return (
    <div data-testid="entry-detail" data-id={id} data-discovered={discovered}>
      <div className="flex items-start gap-3">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${discovered ? '' : 'card-undiscovered'}`} style={{ backgroundColor: `${info.hex}33` }} aria-hidden="true">
          {discovered ? info.emoji : '？'}
        </div>
        <div className="min-w-0 flex-1">
          <CategoryBadge category={category} />
          <h2 className={`mt-2 text-2xl font-black leading-snug ${discovered ? '' : 'text-ink-soft'}`} data-testid="entry-name">
            <Ruby text={name} kana={kana} />
          </h2>
          {!discovered && <p className="text-xs font-bold text-ink-soft">まだ はっけん していないよ。地図で さがしてみよう！</p>}
        </div>
      </div>

      {geo && (
        <div className={`mt-3 h-44 overflow-hidden rounded-2xl bg-sky/30 ${discovered ? '' : 'card-undiscovered'}`}>
          <KamagayaMap
            geo={geo}
            pins={pins}
            pinLabels={discovered ? 'all' : 'none'}
            districtStyles={district ? { [id]: discovered ? 'selected' : 'undiscovered' } : {}}
            districtLabels={district && discovered ? [id] : 'none'}
            focus={firstPin ? { point: firstPin.point, scale: 2.2 } : geoDistrict ? { bbox: geoDistrict.bbox, scale: 3 } : null}
            testId="entry-map"
            ariaLabel={`${name}の位置`}
          />
        </div>
      )}

      {discovered && photo && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold text-ink-soft">めじるし（写真）</p>
          <EntryPhoto photo={photo} />
        </div>
      )}

      <dl className="mt-3 space-y-2 text-sm">
        {facility && (
          <div>
            <dt className="text-xs font-bold text-ink-soft">所在地</dt>
            <dd>{facility.address}</dd>
          </div>
        )}
        {district && geoDistrict && geo && (
          <div>
            <dt className="text-xs font-bold text-ink-soft">場所</dt>
            <dd>
              {describePosition(geoDistrict.centroid, geo.viewBox)}。{district.chomeCount > 0 ? `一丁目から${KANJI_NUM[district.chomeCount] ?? district.chomeCount}丁目まであるよ。` : '丁目のない町だよ。'}
            </dd>
          </div>
        )}
        {discovered && (facility?.description || district?.hint) && (
          <div>
            <dt className="text-xs font-bold text-ink-soft">しょうかい</dt>
            <dd className="leading-relaxed" data-testid="entry-description">
              {facility?.description ?? district?.hint}
            </dd>
          </div>
        )}
        {discovered && facility?.trivia && (
          <div className="rounded-2xl bg-cream px-3 py-2">
            <dt className="text-xs font-bold text-ink-soft">まめちしき</dt>
            <dd className="leading-relaxed">{facility.trivia}</dd>
          </div>
        )}
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        {facility?.officialUrl && <OfficialSiteButton href={facility.officialUrl} data-testid="official-link" />}
        {facility?.municipalUrl && facility.municipalUrl !== facility.officialUrl && (
          <ExternalLink href={facility.municipalUrl} className="inline-flex min-h-12 items-center rounded-3xl border-2 border-line bg-white px-4 text-sm font-bold" data-testid="municipal-link">
            🏛 市の施設案内 ↗
          </ExternalLink>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
        出典:{' '}
        {facility ? (
          <ExternalLink href={facility.sourceUrl} className="underline">
            {new URL(facility.sourceUrl).hostname}
          </ExternalLink>
        ) : (
          DISTRICT_SOURCE.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && '、'}
              <ExternalLink href={s.url} className="underline">
                {s.title}
              </ExternalLink>
            </span>
          ))
        )}
        ／ 位置: {facility ? facility.coordSource : '令和2年国勢調査 小地域境界データ'} ／ 確認日 {facility?.verifiedAt ?? DISTRICT_SOURCE.verifiedAt}
      </p>
    </div>
  )
}
