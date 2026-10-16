import { describe, expect, it } from 'vitest'
import { clampViewBox, distanceKm, nearestPin, pointInPolygon, pointInRing, polygonsToPath, project, viewBoxForBBox, zoomViewBox } from '../../src/lib/geo'
import type { ProjectionMeta } from '../../src/types'

const square: [number, number][] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0],
]

describe('geo', () => {
  it('pointInRing / pointInPolygon', () => {
    expect(pointInRing([5, 5], square)).toBe(true)
    expect(pointInRing([15, 5], square)).toBe(false)
    const hole: [number, number][] = [
      [4, 4],
      [6, 4],
      [6, 6],
      [4, 6],
      [4, 4],
    ]
    expect(pointInPolygon([5, 5], [square, hole])).toBe(false)
    expect(pointInPolygon([1, 1], [square, hole])).toBe(true)
  })

  it('polygonsToPath', () => {
    expect(polygonsToPath([[square]])).toBe('M0 0L10 0L10 10L0 10L0 0Z')
  })

  it('project はビルドスクリプトと同じ式で、padding の位置に原点が来る', () => {
    const meta: ProjectionMeta = { type: 'web-mercator', scale: 1000, offsetLon: 140, offsetMercY: -Math.log(Math.tan(Math.PI / 4 + (35 * Math.PI) / 360)), padding: 20 }
    const [x, y] = project(meta, 140, 35)
    expect(x).toBeCloseTo(20)
    expect(y).toBeCloseTo(20)
    const [x2, y2] = project(meta, 140.1, 35.1)
    expect(x2).toBeGreaterThan(20)
    expect(y2).toBeLessThan(20) // 北ほど y は小さい
  })

  it('zoom / clamp / bbox', () => {
    const base = { x: 0, y: 0, w: 100, h: 200 }
    expect(zoomViewBox(base, 2, 50, 100)).toEqual({ x: 25, y: 50, w: 50, h: 100 })
    expect(zoomViewBox(base, 2, 0, 0)).toEqual({ x: 0, y: 0, w: 50, h: 100 })
    expect(zoomViewBox(base, 0.5, 50, 100)).toEqual(base)
    expect(clampViewBox({ x: 90, y: 190, w: 50, h: 100 }, base)).toEqual({ x: 50, y: 100, w: 50, h: 100 })
    const v = viewBoxForBBox(base, [40, 90, 60, 110], 1, 1, 8)
    expect(v.w).toBeLessThan(100)
    expect(v.x + v.w / 2).toBeCloseTo(50)
  })

  it('distanceKm: 鎌ケ谷市役所から約 1 度の差はおよそ 111km', () => {
    expect(distanceKm(35.77, 140, 36.77, 140)).toBeCloseTo(111.2, 0)
    expect(distanceKm(35.77, 140, 35.77, 140)).toBe(0)
  })

  it('nearestPin: 許容範囲内で最も近いピンを返し、近接していれば ambiguous', () => {
    const pins = [
      { id: 'a', client: [0, 0] as [number, number] },
      { id: 'b', client: [5, 0] as [number, number] },
      { id: 'c', client: [100, 0] as [number, number] },
    ]
    expect(nearestPin([1, 0], pins, 26)).toEqual({ id: 'a', ambiguous: true, nearby: ['a', 'b'] })
    expect(nearestPin([98, 0], pins, 26)).toEqual({ id: 'c', ambiguous: false, nearby: ['c'] })
    expect(nearestPin([50, 0], pins, 26)).toEqual({ id: null, ambiguous: false, nearby: [] })
  })
})
