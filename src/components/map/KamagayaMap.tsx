import { animate } from 'motion/react'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
import { useApp } from '../../app/AppContext'
import {
  clampViewBox,
  clientToSvgPoint,
  hitTestDistrict,
  MAX_SCALE,
  nearestPin,
  polygonsToPath,
  svgToClientPoint,
  viewBoxForBBox,
  viewBoxForPoint,
  viewBoxFromGeo,
  viewBoxToString,
  zoomViewBox,
  type ViewBox,
} from '../../lib/geo'
import type { BBox, FacilityCategory, GeoData, Point } from '../../types'
import { PinShape, pinShapeFor, type PinStyle } from './pins'

export type DistrictStyle = 'target' | 'correct' | 'wrong' | 'hint' | 'discovered' | 'undiscovered' | 'dim' | 'selected'

export interface MapPin {
  id: string
  point: Point
  category: FacilityCategory
  /** 表示名（pinLabels で出す） */
  label: string
  /** スクリーンリーダー用。名前を隠す問題では町名などにする */
  ariaLabel: string
  /** 名前・記号を隠して「？」にする */
  hidden?: boolean
}

export interface MapFocus {
  bbox?: BBox
  point?: Point
  scale?: number
}

export interface KamagayaMapProps {
  geo: GeoData
  pins?: MapPin[]
  pinStyles?: Partial<Record<string, PinStyle>>
  /** ラベルを出すピン。'all' | 'none' | ID 配列 */
  pinLabels?: 'all' | 'none' | string[]
  districtStyles?: Partial<Record<string, DistrictStyle>>
  /** 町名をパステルで塗り分ける（探検・図鑑）。false なら薄い輪郭だけ */
  colorDistricts?: boolean
  /** 丁目の細い境界線 */
  showAreas?: boolean
  /** 町名ラベル。'all' | 'none' | ID 配列 */
  districtLabels?: 'all' | 'none' | string[]
  /** 市境の外（船橋市の飛地など）を薄く見せる */
  interactive?: boolean
  onTapPin?: (id: string, point: Point) => void
  onTapDistrict?: (id: string | null, point: Point) => void
  /** ピンが密集していてどれを選んだか判断しにくいとき（自動で拡大したあとに呼ぶ） */
  onAmbiguousTap?: (ids: string[]) => void
  zoomable?: boolean
  focus?: MapFocus | null
  /** フォーカス時に対象を上寄りに置く（下部にカードが重なるとき用、0〜0.4） */
  focusShiftY?: number
  className?: string
  ariaLabel?: string
  testId?: string
}

const TAP_MOVE_THRESHOLD = 10
const PIN_TOLERANCE_PX = 26
const DISTRICT_PALETTE = ['#ffe8b3', '#cdeedd', '#d6ecff', '#f1dcff', '#ffd9d2', '#fff1a8', '#d9f2c4', '#e0e4ff', '#ffe0ef', '#d4f0f0']

const DISTRICT_FILL: Record<DistrictStyle, { fill: string; stroke: string; opacity?: number }> = {
  target: { fill: '#ffe066', stroke: '#f5b800' },
  correct: { fill: '#58c78e', stroke: '#2f9d66' },
  wrong: { fill: '#ffb56b', stroke: '#d9842f' },
  hint: { fill: '#fff6c2', stroke: '#f5b800' },
  discovered: { fill: '#ffe8b3', stroke: '#ffffff' },
  undiscovered: { fill: '#e8e3dc', stroke: '#ffffff' },
  dim: { fill: '#e8e3dc', stroke: '#ffffff', opacity: 0.5 },
  selected: { fill: '#b8e4ff', stroke: '#5fb3e6' },
}

function KamagayaMapImpl({
  geo,
  pins = [],
  pinStyles = {},
  pinLabels = 'none',
  districtStyles = {},
  colorDistricts = false,
  showAreas = false,
  districtLabels = 'none',
  interactive = false,
  onTapPin,
  onTapDistrict,
  onAmbiguousTap,
  zoomable = false,
  focus = null,
  focusShiftY = 0,
  className = '',
  ariaLabel = '鎌ケ谷市の地図',
  testId = 'kamagaya-map',
}: KamagayaMapProps) {
  const { effects, play } = useApp()
  const base = useMemo(() => viewBoxFromGeo(geo), [geo])
  const [view, setView] = useState<ViewBox>(base)
  const svgRef = useRef<SVGSVGElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ startView: ViewBox; startDist: number; startCenter: Point; moved: boolean; startClient: Point } | null>(null)
  /** 1px あたりの viewBox 単位（ピンを画面上で一定の大きさに保つ） */
  const [pxUnit, setPxUnit] = useState(1)

  const cityPath = useMemo(() => polygonsToPath(geo.city.polygons), [geo])
  const districtPaths = useMemo(() => geo.districts.map((d) => ({ id: d.id, d: polygonsToPath(d.polygons) })), [geo])
  const areaPath = useMemo(() => polygonsToPath(geo.areas.flatMap((a) => a.polygons)), [geo])

  // 表示サイズが変わったときだけ単位を更新する（リサイズ時のみ）
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const update = () => {
      const rect = svg.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      // preserveAspectRatio="meet" なので、幅と高さのうち厳しいほうで実効スケールが決まる
      setPxUnit(1 / Math.min(rect.width / base.w, rect.height / base.h))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [base.w, base.h])

  // フォーカス先が変わったら viewBox をなめらかに補間する（省電力時は即時）
  const viewRef = useRef(view)
  viewRef.current = view
  useEffect(() => {
    let target = base
    if (focus?.bbox) target = viewBoxForBBox(base, focus.bbox, 1.8, 1.2, focus.scale ?? 4)
    else if (focus?.point) target = viewBoxForPoint(base, focus.point, focus.scale ?? 3)
    if (focus) target = clampViewBox({ ...target, y: target.y + target.h * focusShiftY }, base)
    if (!effects) {
      setView(target)
      return
    }
    const from = viewRef.current
    const controls = animate(0, 1, {
      duration: 0.4,
      ease: 'easeInOut',
      onUpdate: (t) =>
        setView({
          x: from.x + (target.x - from.x) * t,
          y: from.y + (target.y - from.y) * t,
          w: from.w + (target.w - from.w) * t,
          h: from.h + (target.h - from.h) * t,
        }),
    })
    return () => controls.stop()
    // viewRef は最新値を読むだけなので依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, focusShiftY, base, effects])

  const scale = base.w / view.w
  /** ピン・ラベル用の倍率: 画面ピクセル → viewBox 単位 */
  const k = pxUnit / scale

  const zoomBy = useCallback(
    (factor: number, center?: Point) => {
      setView((v) => {
        const cx = center?.[0] ?? v.x + v.w / 2
        const cy = center?.[1] ?? v.y + v.h / 2
        return zoomViewBox(base, Math.max(1, Math.min(MAX_SCALE, (base.w / v.w) * factor)), cx, cy)
      })
    },
    [base],
  )

  const handleTapAt = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return
      const point = clientToSvgPoint(svg, clientX, clientY)
      if (!point) return
      if (pins.length > 0 && onTapPin) {
        const candidates = pins
          .map((p) => ({ id: p.id, client: svgToClientPoint(svg, p.point) }))
          .filter((p): p is { id: string; client: Point } => p.client !== null)
        const hit = nearestPin([clientX, clientY], candidates, PIN_TOLERANCE_PX)
        if (hit.id) {
          if (hit.ambiguous && zoomable && scale < MAX_SCALE) {
            // 密集していたら拡大して選び直してもらう
            setView((v) => zoomViewBox(base, Math.min(MAX_SCALE, (base.w / v.w) * 2.2), point[0], point[1]))
            onAmbiguousTap?.(hit.nearby)
            return
          }
          onTapPin(hit.id, point)
          return
        }
      }
      onTapDistrict?.(hitTestDistrict(point, geo.districts), point)
    },
    [pins, onTapPin, onTapDistrict, onAmbiguousTap, zoomable, scale, base, geo.districts],
  )

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive && !zoomable) return
    const svg = svgRef.current
    if (!svg) return
    try {
      svg.setPointerCapture(e.pointerId)
    } catch {
      // 合成イベントなどで capture できない場合は無視する
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    if (pts.length === 1) {
      gesture.current = { startView: view, startDist: 0, startCenter: [e.clientX, e.clientY], moved: false, startClient: [e.clientX, e.clientY] }
    } else if (pts.length === 2) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }]
      gesture.current = { startView: view, startDist: Math.hypot(a.x - b.x, a.y - b.y), startCenter: [(a.x + b.x) / 2, (a.y + b.y) / 2], moved: true, startClient: [e.clientX, e.clientY] }
    }
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current
    const svg = svgRef.current
    if (!g || !svg || !pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    const rect = svg.getBoundingClientRect()
    const unitsPerPx = g.startView.w / rect.width

    if (pts.length >= 2 && zoomable) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const ratio = g.startDist > 0 ? dist / g.startDist : 1
      const centerNow: Point = [(a.x + b.x) / 2, (a.y + b.y) / 2]
      const startScale = base.w / g.startView.w
      const nextScale = Math.max(1, Math.min(MAX_SCALE, startScale * ratio))
      const w = base.w / nextScale
      const h = base.h / nextScale
      const anchor = clientToSvgPointIn(g.startView, rect, g.startCenter)
      const fx = (g.startCenter[0] - rect.left) / rect.width
      const fy = (g.startCenter[1] - rect.top) / rect.height
      const dx = (centerNow[0] - g.startCenter[0]) * (w / rect.width)
      const dy = (centerNow[1] - g.startCenter[1]) * (h / rect.height)
      setView(clampViewBox({ x: anchor[0] - fx * w - dx, y: anchor[1] - fy * h - dy, w, h }, base))
      g.moved = true
      return
    }

    const dx = e.clientX - g.startClient[0]
    const dy = e.clientY - g.startClient[1]
    if (!g.moved && Math.hypot(dx, dy) < TAP_MOVE_THRESHOLD) return
    g.moved = true
    if (zoomable && scale > 1.01) {
      setView(clampViewBox({ ...g.startView, x: g.startView.x - dx * unitsPerPx, y: g.startView.y - dy * unitsPerPx }, base))
    }
  }

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current
    pointers.current.delete(e.pointerId)
    if (!g) return
    if (pointers.current.size === 0) {
      gesture.current = null
      if (!g.moved && interactive) handleTapAt(e.clientX, e.clientY)
    }
  }

  const onWheel = (e: WheelEvent<SVGSVGElement>) => {
    if (!zoomable) return
    const svg = svgRef.current
    if (!svg) return
    const p = clientToSvgPoint(svg, e.clientX, e.clientY)
    zoomBy(e.deltaY < 0 ? 1.2 : 1 / 1.2, p ?? undefined)
  }

  const onPinKey = (e: KeyboardEvent<SVGGElement>, pin: MapPin) => {
    if (!interactive) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTapPin?.(pin.id, pin.point)
    }
  }

  const onDistrictKey = (e: KeyboardEvent<SVGPathElement>, id: string, centroid: Point) => {
    if (!interactive || !onTapDistrict) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTapDistrict(id, centroid)
    }
  }

  const pinLabelSet = pinLabels === 'all' ? null : new Set(pinLabels === 'none' ? [] : pinLabels)
  const districtLabelSet = districtLabels === 'all' ? null : new Set(districtLabels === 'none' ? [] : districtLabels)
  const districtsFocusable = interactive && !!onTapDistrict
  const hasDistrictHighlight = Object.keys(districtStyles).length > 0

  return (
    <div className={`relative h-full w-full ${className}`}>
      <svg
        ref={svgRef}
        className="map-svg relative block h-full w-full"
        viewBox={viewBoxToString(view)}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={ariaLabel}
        data-testid={testId}
        data-scale={scale.toFixed(2)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <defs>
          <filter id="city-shadow" x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#453830" floodOpacity="0.16" />
          </filter>
        </defs>
        {/* 市境 */}
        <path d={cityPath} fill="#fff8e6" stroke="#e5b56a" strokeWidth={3 / Math.sqrt(scale)} strokeLinejoin="round" filter="url(#city-shadow)" data-layer="city" />
        {/* 町名 */}
        <g data-layer="districts">
          {districtPaths.map(({ id, d }, i) => {
            const style = districtStyles[id]
            let fill = colorDistricts ? DISTRICT_PALETTE[i % DISTRICT_PALETTE.length]! : 'transparent'
            let stroke = colorDistricts ? '#ffffff' : '#e5c998'
            let opacity = 1
            let cls = 'map-district'
            if (style) {
              const s = DISTRICT_FILL[style]
              fill = s.fill
              stroke = s.stroke
              opacity = s.opacity ?? 1
              if (style === 'target') cls += ' map-district-target'
            } else if (hasDistrictHighlight && colorDistricts) {
              opacity = 0.55
            }
            const geoD = geo.districts[i]!
            return (
              <path
                key={id}
                d={d}
                className={cls}
                fill={fill}
                fillOpacity={style ? 0.85 : colorDistricts ? 0.9 : 0}
                stroke={stroke}
                strokeWidth={(style ? 2.5 : 1.2) / Math.sqrt(scale)}
                strokeLinejoin="round"
                opacity={opacity}
                data-district={id}
                data-style={style ?? 'normal'}
                role={districtsFocusable ? 'button' : undefined}
                tabIndex={districtsFocusable ? 0 : undefined}
                aria-label={districtsFocusable ? geoD.name : undefined}
                onKeyDown={(e) => onDistrictKey(e, id, geoD.centroid)}
                onFocus={() => districtsFocusable && play('tap')}
              />
            )
          })}
        </g>
        {showAreas && <path d={areaPath} fill="none" stroke="#ffffff" strokeWidth={0.8 / Math.sqrt(scale)} strokeDasharray={`${3 / Math.sqrt(scale)} ${3 / Math.sqrt(scale)}`} pointerEvents="none" data-layer="areas" />}
        {/* 町名ラベル */}
        <g pointerEvents="none" data-layer="district-labels">
          {geo.districts
            .filter((d) => districtLabelSet === null || districtLabelSet.has(d.id))
            .map((d) => (
              <text key={`dl-${d.id}`} x={d.centroid[0]} y={d.centroid[1]} textAnchor="middle" dominantBaseline="central" fontSize={11 * k} fontWeight="700" fill="#5c4a3d" className="text-halo">
                {d.name}
              </text>
            ))}
        </g>
        {/* ピン */}
        <g data-layer="pins">
          {pins.map((pin) => {
            const style = pinStyles[pin.id] ?? 'normal'
            const dim = style === 'dim'
            return (
              <g
                key={pin.id}
                className={`map-pin${style === 'target' ? ' pin-attn' : ''}`}
                transform={`translate(${pin.point[0]} ${pin.point[1]}) scale(${k})`}
                opacity={dim ? 0.35 : 1}
                data-pin={pin.id}
                data-style={style}
                role={interactive && onTapPin ? 'button' : undefined}
                tabIndex={interactive && onTapPin ? 0 : undefined}
                aria-label={pin.ariaLabel}
                onKeyDown={(e) => onPinKey(e, pin)}
                onFocus={() => interactive && play('tap')}
              >
                <PinShape category={pin.category} style={style === 'dim' ? 'normal' : style} hidden={!!pin.hidden} shape={pinShapeFor(pin.category)} />
              </g>
            )
          })}
        </g>
        {/* ピンのラベル */}
        <g pointerEvents="none" data-layer="pin-labels">
          {pins
            .filter((p) => !p.hidden && (pinLabelSet === null || pinLabelSet.has(p.id)))
            .map((p) => (
              <text key={`pl-${p.id}`} x={p.point[0]} y={p.point[1] + 11 * k} textAnchor="middle" fontSize={11 * k} fontWeight="700" fill="#453830" className="text-halo">
                {p.label}
              </text>
            ))}
        </g>
      </svg>
      {zoomable && (
        <div className="absolute right-2 bottom-2 flex flex-col gap-1.5" role="group" aria-label="地図のズーム">
          <ZoomButton label="拡大" onClick={() => zoomBy(1.6)}>
            ＋
          </ZoomButton>
          <ZoomButton label="縮小" onClick={() => zoomBy(1 / 1.6)}>
            －
          </ZoomButton>
          <ZoomButton label="全体を表示" onClick={() => setView(base)}>
            ⟲
          </ZoomButton>
        </div>
      )}
    </div>
  )
}

export const KamagayaMap = memo(KamagayaMapImpl)

function clientToSvgPointIn(view: ViewBox, rect: DOMRect, client: Point): Point {
  const scale = Math.min(rect.width / view.w, rect.height / view.h)
  const offsetX = (rect.width - view.w * scale) / 2
  const offsetY = (rect.height - view.h * scale) / 2
  return [view.x + (client[0] - rect.left - offsetX) / scale, view.y + (client[1] - rect.top - offsetY) / scale]
}

function ZoomButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  const { play } = useApp()
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="btn-pop focus-ring h-11 w-11 rounded-full border-2 border-line bg-white text-lg font-bold text-ink"
      onClick={() => {
        play('tap')
        onClick()
      }}
    >
      {children}
    </button>
  )
}
