import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CHILDREN_CENTERS, DISTRICTS, ELEMENTARY_SCHOOLS, FACILITIES, JUNIOR_HIGH_SCHOOLS, LIBRARIES, ALL_ENTRY_IDS, ENTRY_COUNTS, TOTAL_ENTRIES } from '../../src/data/facilities'
import districtIds from '../../src/data/district-ids.json'
import type { GeoData } from '../../src/types'
import { pointInShape, project } from '../../src/lib/geo'

const geo = JSON.parse(readFileSync(resolve(process.cwd(), 'public/data/geo/kamagaya.json'), 'utf8')) as GeoData

// 鎌ケ谷市の緯度経度の範囲（市境 bbox）
const LAT = [35.738, 35.804] as const
const LNG = [139.968, 140.029] as const

describe('施設データ', () => {
  it('小学校 9 校・中学校 5 校・図書館 6・児童センター 6 が登録されている', () => {
    expect(ELEMENTARY_SCHOOLS).toHaveLength(9)
    expect(JUNIOR_HIGH_SCHOOLS).toHaveLength(5)
    expect(LIBRARIES).toHaveLength(6)
    expect(CHILDREN_CENTERS).toHaveLength(6)
    expect(ENTRY_COUNTS).toEqual({ elementary: 9, 'junior-high': 5, library: 6, 'children-center': 6, district: 31 })
    expect(TOTAL_ENTRIES).toBe(57)
  })

  it('指定の学校名がすべて含まれる', () => {
    const names = FACILITIES.map((f) => f.name)
    for (const n of ['鎌ケ谷小学校', '東部小学校', '南部小学校', '北部小学校', '西部小学校', '中部小学校', '初富小学校', '道野辺小学校', '五本松小学校', '鎌ケ谷中学校', '第二中学校', '第三中学校', '第四中学校', '第五中学校']) {
      expect(names).toContain(n)
    }
    for (const n of ['図書館本館', '東部分館', '北部分館', '西部分館', '南部分館', '東初富分館', '東部児童センター', '中央児童センター', '南児童センター', 'くぬぎ山児童センター', '北中沢児童センター', '粟野児童センター']) {
      expect(names).toContain(n)
    }
  })

  it('ID と名前が一意である', () => {
    expect(new Set(ALL_ENTRY_IDS).size).toBe(ALL_ENTRY_IDS.length)
    expect(new Set(FACILITIES.map((f) => f.name)).size).toBe(FACILITIES.length)
    expect(new Set(DISTRICTS.map((d) => d.name)).size).toBe(DISTRICTS.length)
  })

  it('座標が鎌ケ谷市の範囲内で、市境ポリゴンの中にある', () => {
    for (const f of FACILITIES) {
      expect(f.latitude, f.name).toBeGreaterThan(LAT[0])
      expect(f.latitude, f.name).toBeLessThan(LAT[1])
      expect(f.longitude, f.name).toBeGreaterThan(LNG[0])
      expect(f.longitude, f.name).toBeLessThan(LNG[1])
      const p = project(geo.projection, f.longitude, f.latitude)
      expect(pointInShape(p, geo.city), `${f.name} が市境の外`).toBe(true)
    }
  })

  it('必須の出典情報・確認日・ふりがな・町名がある', () => {
    for (const f of FACILITIES) {
      expect(f.sourceUrl, f.name).toMatch(/^https:\/\//)
      expect(f.verifiedAt, f.name).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(f.kana, f.name).toMatch(/^[ぁ-んー・ァ-ヶ]+$/)
      expect(f.coordSource.length, f.name).toBeGreaterThan(0)
      expect(DISTRICTS.map((d) => d.name), `${f.name} の町名 ${f.town}`).toContain(f.town)
      expect(f.address, f.name).toContain(f.town)
    }
  })

  it('公式 URL は https で、学校は市と学校の両方の URL を持つ', () => {
    for (const f of FACILITIES) {
      if (f.officialUrl) expect(f.officialUrl, f.name).toMatch(/^https:\/\//)
      if (f.municipalUrl) expect(f.municipalUrl, f.name).toMatch(/^https:\/\/www\.city\.kamagaya\.chiba\.jp\//)
    }
    for (const s of [...ELEMENTARY_SCHOOLS, ...JUNIOR_HIGH_SCHOOLS]) {
      expect(s.officialUrl, s.name).toMatch(/^https:\/\/swa\.kamagaya\.ed\.jp\//)
      expect(s.municipalUrl, s.name).toMatch(/^https:\/\/www\.city\.kamagaya\.chiba\.jp\/sisetsu\/(shougakou|chuugakou)\//)
    }
    for (const l of LIBRARIES) expect(l.officialUrl).toMatch(/^https:\/\/www\.library-kamagaya-chiba\.jp\//)
    for (const c of CHILDREN_CENTERS) expect(c.officialUrl).toMatch(/^https:\/\/www\.city\.kamagaya\.chiba\.jp\/sisetsu\/jidoucenter\//)
  })

  it('公式 URL が正しい施設に対応している（URL のスラッグと ID が一致）', () => {
    const slug = (f: { officialUrl?: string }) => f.officialUrl ?? ''
    expect(slug(ELEMENTARY_SCHOOLS.find((s) => s.name === '東部小学校')!)).toContain('id=102')
    expect(slug(JUNIOR_HIGH_SCHOOLS.find((s) => s.name === '第五中学校')!)).toContain('id=205')
    expect(slug(CHILDREN_CENTERS.find((s) => s.name === '粟野児童センター')!)).toContain('awano-jidou')
    expect(slug(LIBRARIES.find((s) => s.name === '西部分館')!)).toContain('#seibu')
    expect(ELEMENTARY_SCHOOLS.find((s) => s.name === '鎌ケ谷小学校')!.municipalUrl).toContain('/shougakou/kamagaya.html')
  })
})

describe('町名データ', () => {
  it('地図データの町名 31 件と ID・名前が一致する', () => {
    expect(DISTRICTS).toHaveLength(31)
    expect(geo.districts).toHaveLength(31)
    const byId = new Map(districtIds.map((d) => [d.id, d]))
    for (const d of DISTRICTS) {
      const g = byId.get(d.id)
      expect(g, d.name).toBeDefined()
      expect(g!.name).toBe(d.name)
      expect(g!.chomeCount, d.name).toBe(d.chomeCount)
    }
    for (const g of geo.districts) expect(DISTRICTS.map((d) => d.id)).toContain(g.id)
  })

  it('ふりがなはひらがなのみ', () => {
    for (const d of DISTRICTS) expect(d.kana, d.name).toMatch(/^[ぁ-んー]+$/)
  })

  it('各施設の所在町名の区域に、施設の座標が含まれる', () => {
    for (const f of FACILITIES) {
      const d = DISTRICTS.find((x) => x.name === f.town)!
      const shape = geo.districts.find((g) => g.id === d.id)!
      const p = project(geo.projection, f.longitude, f.latitude)
      expect(pointInShape(p, shape), `${f.name} は ${f.town} の区域外（座標か町名を確認）`).toBe(true)
    }
  })
})

describe('地図データ', () => {
  it('市境・町名・町丁が入っていて、出典が記録されている', () => {
    expect(geo.city.polygons.length).toBeGreaterThan(0)
    expect(geo.areas.length).toBe(92)
    expect(geo.sources).toHaveLength(2)
    expect(geo.viewBox[3]).toBe(1000)
    expect(geo.projection.type).toBe('web-mercator')
  })
})
