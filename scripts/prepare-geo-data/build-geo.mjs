#!/usr/bin/env node
/**
 * 鎌ケ谷市の市境（国土数値情報 N03）と町丁境界（令和2年国勢調査 小地域）から、
 * ゲーム用の軽量な地図データ public/data/geo/kamagaya.json を生成する。
 *
 * 処理内容
 *   1. 経緯度を Web メルカトル投影で平面座標に変換し、SVG viewBox（高さ 1000）に収める
 *   2. 市境と町丁をひとつの TopoJSON にして、境界を共有したまま単純化（Visvalingam）する
 *   3. 町丁（KEY_CODE 単位）を町名（KIHON1 単位）にマージして「町名」レイヤーを作る
 *   4. 面積・重心・bbox を計算して JSON に書き出す
 *
 * 入力は data/source/ に同梱している（元データの出典は data/source/README.md）。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { topology } from 'topojson-server'
import { feature, merge } from 'topojson-client'
import { presimplify, simplify } from 'topojson-simplify'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const SRC_DIR = join(ROOT, 'data', 'source')
const OUT_PATH = join(ROOT, 'public', 'data', 'geo', 'kamagaya.json')
const TOWNS_PATH = join(ROOT, 'src', 'data', 'district-ids.json')

const VIEW_HEIGHT = 1000
const PADDING = 20
/** 単純化の閾値（viewBox 座標系での三角形面積）。1 単位 ≒ 7m */
const SIMPLIFY_MIN_WEIGHT = 0.35
const PRECISION = 1

// --- 投影 -------------------------------------------------------------------
const toRad = (deg) => (deg * Math.PI) / 180
const mercatorY = (lat) => -Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2))

function walkCoords(geometry, fn) {
  const rec = (coords, depth) => (depth === 0 ? fn(coords) : coords.map((c) => rec(c, depth - 1)))
  if (geometry.type === 'Polygon') return { ...geometry, coordinates: rec(geometry.coordinates, 2) }
  if (geometry.type === 'MultiPolygon') return { ...geometry, coordinates: rec(geometry.coordinates, 3) }
  throw new Error(`Unsupported geometry: ${geometry.type}`)
}

function buildProjection(features) {
  let minLon = Infinity, minY = Infinity, maxLon = -Infinity, maxY = -Infinity
  for (const f of features) {
    walkCoords(f.geometry, ([lon, lat]) => {
      const y = mercatorY(lat)
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      return [lon, lat]
    })
  }
  const spanY = maxY - minY
  const spanX = toRad(maxLon) - toRad(minLon)
  const scale = (VIEW_HEIGHT - PADDING * 2) / spanY
  const width = Math.round(spanX * scale + PADDING * 2)
  const project = ([lon, lat]) => [
    (toRad(lon) - toRad(minLon)) * scale + PADDING,
    (mercatorY(lat) - minY) * scale + PADDING,
  ]
  return {
    project,
    viewBox: [0, 0, width, VIEW_HEIGHT],
    meta: { type: 'web-mercator', scale, offsetLon: minLon, offsetMercY: minY, padding: PADDING },
  }
}

// --- 幾何計算 ---------------------------------------------------------------
function ringArea(ring) {
  let a = 0
  for (let i = 0, n = ring.length - 1; i < n; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  return a / 2
}

function ringCentroid(ring) {
  let cx = 0, cy = 0, a = 0
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    const cross = ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    cx += (ring[i][0] + ring[i + 1][0]) * cross
    cy += (ring[i][1] + ring[i + 1][1]) * cross
    a += cross
  }
  a /= 2
  return a === 0 ? ring[0] : [cx / (6 * a), cy / (6 * a)]
}

const round = (v) => Number(v.toFixed(PRECISION))

/** GeoJSON geometry → { polygons, centroid, bbox }（座標は丸める） */
function toShape(geometry, label) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const polygons = polys
    .map((rings) => rings.map((ring) => ring.map(([x, y]) => [round(x), round(y)])).filter((ring) => ring.length >= 4))
    .filter((rings) => rings.length > 0 && Math.abs(ringArea(rings[0])) > 0.5)
  if (polygons.length === 0) throw new Error(`${label} のポリゴンが空になりました`)
  let largest = polygons[0][0]
  let largestArea = 0
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const rings of polygons) {
    const outer = Math.abs(ringArea(rings[0]))
    if (outer > largestArea) {
      largestArea = outer
      largest = rings[0]
    }
    for (const [x, y] of rings[0]) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const [cx, cy] = ringCentroid(largest)
  return { polygons, centroid: [round(cx), round(cy)], bbox: [round(minX), round(minY), round(maxX), round(maxY)] }
}

/** 「新鎌ケ谷一丁目」→「新鎌ケ谷」 */
const townName = (sName) => sName.replace(/[一二三四五六七八九十]+丁目$/, '')

/** ASCII の安定した ID（KIHON1 ベース） */
const districtId = (kihon1) => `town-${kihon1}`

// --- メイン -----------------------------------------------------------------
async function main() {
  const city = JSON.parse(await readFile(join(SRC_DIR, 'n03-2024-kamagaya-city.geojson'), 'utf8'))
  const areas = JSON.parse(await readFile(join(SRC_DIR, 'estat-2020-kamagaya-small-areas.geojson'), 'utf8'))

  const cityFeature = city.features.find((f) => f.properties.N03_007 === '12224')
  if (!cityFeature) throw new Error('N03 に鎌ケ谷市（12224）がありません')

  const areaFeatures = areas.features
    .filter((f) => f.properties.HCODE === 8101 || String(f.properties.HCODE) === '8101')
    .map((f, i) => ({
      type: 'Feature',
      id: `${f.properties.KEY_CODE}-${f.properties.KIGO_E || 'E1'}-${i}`,
      properties: {
        code: String(f.properties.KEY_CODE),
        name: String(f.properties.S_NAME).trim(),
        kihon1: String(f.properties.KIHON1).padStart(4, '0'),
        chome: Number(f.properties.KIHON2) || 0,
      },
      geometry: f.geometry,
    }))

  const projection = buildProjection([cityFeature, ...areaFeatures])
  const projectedCity = { ...cityFeature, id: 'city', properties: { code: '12224', name: '鎌ケ谷市' }, geometry: walkCoords(cityFeature.geometry, projection.project) }
  const projectedAreas = areaFeatures.map((f) => ({ ...f, geometry: walkCoords(f.geometry, projection.project) }))

  let topo = topology(
    {
      city: { type: 'FeatureCollection', features: [projectedCity] },
      areas: { type: 'FeatureCollection', features: projectedAreas },
    },
    1e5,
  )
  topo = presimplify(topo)
  topo = simplify(topo, SIMPLIFY_MIN_WEIGHT)

  const cityShape = toShape(feature(topo, topo.objects.city).features[0].geometry, '鎌ケ谷市')

  // 町丁（表示用の細い境界）
  const areaGeoms = topo.objects.areas.geometries
  const areaFc = feature(topo, topo.objects.areas)
  const areaShapes = areaFc.features.map((f) => ({
    code: f.properties.code,
    name: f.properties.name,
    districtId: districtId(f.properties.kihon1),
    ...toShape(f.geometry, f.properties.name),
  }))

  // 町名（KIHON1 単位にマージ）
  const byKihon1 = new Map()
  for (const g of areaGeoms) {
    const k = g.properties.kihon1
    if (!byKihon1.has(k)) byKihon1.set(k, { kihon1: k, name: townName(g.properties.name), geoms: [], codes: new Map() })
    const t = byKihon1.get(k)
    t.geoms.push(g)
    t.codes.set(g.properties.code, g.properties.name)
  }
  const districts = [...byKihon1.values()]
    .sort((a, b) => a.kihon1.localeCompare(b.kihon1))
    .map((t) => {
      const merged = merge(topo, t.geoms)
      return {
        id: districtId(t.kihon1),
        name: t.name,
        areas: [...t.codes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([code, name]) => ({ code, name })),
        ...toShape(merged, t.name),
      }
    })

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sources: [
      {
        name: '国土数値情報 行政区域データ（N03）令和6年版',
        provider: '国土交通省',
        url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html',
        license: 'CC BY 4.0',
        note: '鎌ケ谷市の地物のみ抽出し、Web メルカトル投影と境界の単純化を行っています。',
      },
      {
        name: '令和2年国勢調査 小地域境界データ（町丁・字等）',
        provider: '総務省統計局（政府統計の総合窓口 e-Stat）',
        url: 'https://www.e-stat.go.jp/gis/statmap-search?page=1&type=2&aggregateUnitForBoundary=A&toukeiCode=00200521&toukeiYear=2020&serveyId=A002005212020&prefCode=12&coordsys=1&format=shape&datum=2011',
        license: '政府標準利用規約（第2.0版）/ CC BY 4.0 互換',
        note: '鎌ケ谷市の地物のみ抽出し、Web メルカトル投影・境界の単純化・丁目の町名単位への統合を行っています。統計上の小地域であり、住居表示や通学区域の境界とは一致しません。',
      },
    ],
    viewBox: projection.viewBox,
    projection: projection.meta,
    city: cityShape,
    districts,
    areas: areaShapes,
  }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  const json = JSON.stringify(output)
  await writeFile(OUT_PATH, json)
  // 町名 ID と名前の対応（src/data/districts.ts の検証用）
  await writeFile(TOWNS_PATH, JSON.stringify(districts.map((d) => ({ id: d.id, name: d.name, chomeCount: d.areas.filter((a) => /丁目$/.test(a.name)).length })), null, 2) + '\n')

  const points = (shapes) => shapes.reduce((s, m) => s + m.polygons.reduce((t, rings) => t + rings.reduce((u, r) => u + r.length, 0), 0), 0)
  console.log(
    `city points: ${points([cityShape])}, districts: ${districts.length} (${points(districts)} pts), areas: ${areaShapes.length} (${points(areaShapes)} pts), size: ${(json.length / 1024).toFixed(1)} KB, viewBox: ${projection.viewBox.join(' ')}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
