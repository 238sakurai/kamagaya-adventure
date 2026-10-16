import type { BBox, GeoData, GeoDistrict, GeoShape, Point, PolygonRings, ProjectionMeta } from '../types'

// --- 投影（ビルド時スクリプトと同じ式） ------------------------------------

const toRad = (deg: number) => (deg * Math.PI) / 180
const mercatorY = (lat: number) => -Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2))

/** 経緯度を地図データの viewBox 座標へ変換する */
export function project(meta: ProjectionMeta, longitude: number, latitude: number): Point {
  return [
    (toRad(longitude) - toRad(meta.offsetLon)) * meta.scale + meta.padding,
    (mercatorY(latitude) - meta.offsetMercY) * meta.scale + meta.padding,
  ]
}

// --- 当たり判定 -------------------------------------------------------------

/** 閉じたリングに対する点の内外判定（レイキャスティング法） */
export function pointInRing(point: Point, ring: readonly Point[]): boolean {
  const [x, y] = point
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

export function pointInPolygon(point: Point, rings: PolygonRings): boolean {
  const [outer, ...holes] = rings
  if (!outer || !pointInRing(point, outer)) return false
  return !holes.some((hole) => pointInRing(point, hole))
}

export function pointInShape(point: Point, shape: GeoShape): boolean {
  const [x, y] = point
  const [minX, minY, maxX, maxY] = shape.bbox
  if (x < minX || x > maxX || y < minY || y > maxY) return false
  return shape.polygons.some((rings) => pointInPolygon(point, rings))
}

/** viewBox 座標の点がどの町名に含まれるかを返す。どこにも含まれなければ null */
export function hitTestDistrict(point: Point, districts: readonly GeoDistrict[]): string | null {
  for (const d of districts) if (pointInShape(point, d)) return d.id
  return null
}

/** 2 点間の距離（viewBox 単位） */
export const distance = (a: Point, b: Point): number => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * 地球上の 2 地点の距離（km、ハバーサイン法）。
 * 「近くの施設」の判定に使う。通学区域の判定には使わない。
 */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// --- SVG ------------------------------------------------------------------

/** MultiPolygon を SVG の path d 属性に変換する */
export function polygonsToPath(polygons: readonly PolygonRings[]): string {
  let d = ''
  for (const rings of polygons) {
    for (const ring of rings) {
      ring.forEach(([x, y], i) => {
        d += `${i === 0 ? 'M' : 'L'}${x} ${y}`
      })
      d += 'Z'
    }
  }
  return d
}

export interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

export const viewBoxFromGeo = (geo: Pick<GeoData, 'viewBox'>): ViewBox => ({
  x: geo.viewBox[0],
  y: geo.viewBox[1],
  w: geo.viewBox[2],
  h: geo.viewBox[3],
})

export const viewBoxToString = (v: ViewBox): string => `${v.x} ${v.y} ${v.w} ${v.h}`

/**
 * 画面上の座標（clientX/Y）を SVG の viewBox 座標に変換する。
 * getScreenCTM は viewBox と preserveAspectRatio を含む変換なので、リサイズ後もずれない。
 */
export function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
  return [pt.x, pt.y]
}

/** viewBox 座標を画面座標へ（ピンの当たり判定をピクセル単位で行うため） */
export function svgToClientPoint(svg: SVGSVGElement, point: Point): Point | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const pt = new DOMPoint(point[0], point[1]).matrixTransform(ctm)
  return [pt.x, pt.y]
}

export const MAX_SCALE = 8

/** 基準 viewBox の中で (cx, cy) を中心に scale 倍に拡大した viewBox を返す（範囲外へはみ出さない） */
export function zoomViewBox(base: ViewBox, scale: number, cx: number, cy: number): ViewBox {
  const s = Math.max(1, Math.min(scale, MAX_SCALE))
  const w = base.w / s
  const h = base.h / s
  return clampViewBox({ x: cx - w / 2, y: cy - h / 2, w, h }, base)
}

export function clampViewBox(v: ViewBox, base: ViewBox): ViewBox {
  const w = Math.min(v.w, base.w)
  const h = Math.min(v.h, base.h)
  const x = Math.min(Math.max(v.x, base.x), base.x + base.w - w)
  const y = Math.min(Math.max(v.y, base.y), base.y + base.h - h)
  return { x, y, w, h }
}

/** bbox が収まるように、余白つきで拡大した viewBox を返す */
export function viewBoxForBBox(base: ViewBox, bbox: BBox, padding = 1.6, minScale = 1, maxScale = 5): ViewBox {
  const [minX, minY, maxX, maxY] = bbox
  const bw = Math.max(1, (maxX - minX) * padding)
  const bh = Math.max(1, (maxY - minY) * padding)
  const scale = Math.max(minScale, Math.min(maxScale, Math.min(base.w / bw, base.h / bh)))
  return zoomViewBox(base, scale, (minX + maxX) / 2, (minY + maxY) / 2)
}

/** 点を中心に scale 倍で拡大した viewBox */
export function viewBoxForPoint(base: ViewBox, point: Point, scale: number): ViewBox {
  return zoomViewBox(base, scale, point[0], point[1])
}

export function findDistrict(geo: GeoData, id: string): GeoDistrict | undefined {
  return geo.districts.find((d) => d.id === id)
}

/** 画面上の距離で最も近いピンを探す。候補が複数近接していれば ambiguous */
export interface PinHit {
  id: string | null
  /** 許容範囲内に複数のピンがあり、どれを選んだか判断しにくい */
  ambiguous: boolean
  nearby: string[]
}

export function nearestPin(
  tapClient: Point,
  pins: readonly { id: string; client: Point }[],
  tolerancePx: number,
): PinHit {
  const within = pins
    .map((p) => ({ id: p.id, d: distance(tapClient, p.client) }))
    .filter((p) => p.d <= tolerancePx)
    .sort((a, b) => a.d - b.d)
  if (within.length === 0) return { id: null, ambiguous: false, nearby: [] }
  const [first, second] = within
  // 2 番目も十分近い（差が 12px 以内）ならあいまい
  const ambiguous = second !== undefined && second.d - first!.d < 12
  return { id: first!.id, ambiguous, nearby: within.map((p) => p.id) }
}
