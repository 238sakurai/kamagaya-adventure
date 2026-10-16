import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FACILITIES } from '../../src/data/facilities'
import { project, unproject } from '../../src/lib/geo'
import { districtLatLng, googleMapsUrl, streetViewUrl } from '../../src/lib/mapLinks'
import type { GeoData } from '../../src/types'

const geo = JSON.parse(readFileSync(resolve(process.cwd(), 'public/data/geo/kamagaya.json'), 'utf8')) as GeoData

// 鎌ケ谷市役所付近
const CITY_HALL = { latitude: 35.776611, longitude: 140.000778 }

describe('mapLinks', () => {
  it('Google マップの URL は api=1 と query=lat,lng の形式', () => {
    const url = new URL(googleMapsUrl(CITY_HALL))
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/search/')
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('query')).toBe('35.776611,140.000778')
    expect(url.searchParams.has('key')).toBe(false)
  })

  it('ストリートビューの URL は map_action=pano と viewpoint=lat,lng の形式', () => {
    const url = new URL(streetViewUrl(CITY_HALL))
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/@')
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('map_action')).toBe('pano')
    expect(url.searchParams.get('viewpoint')).toBe('35.776611,140.000778')
    expect(url.searchParams.has('key')).toBe(false)
  })

  it('座標は小数 6 桁に丸められる（指数表記や長い小数にならない）', () => {
    const url = new URL(googleMapsUrl({ latitude: 35.7, longitude: 140.00000000001 }))
    expect(url.searchParams.get('query')).toBe('35.700000,140.000000')
  })

  it('unproject は project の逆変換（往復誤差が 1e-9 度未満）', () => {
    for (const f of FACILITIES) {
      const point = project(geo.projection, f.longitude, f.latitude)
      const back = unproject(geo.projection, point)
      expect(Math.abs(back.latitude - f.latitude)).toBeLessThan(1e-9)
      expect(Math.abs(back.longitude - f.longitude)).toBeLessThan(1e-9)
    }
  })

  it('viewBox 座標が小数 1 桁に丸められていても誤差は約 10m 以内', () => {
    // 地図データの座標は小数 1 桁。0.05 単位のずれが何 m になるか確認する
    const point = project(geo.projection, CITY_HALL.longitude, CITY_HALL.latitude)
    const rounded = [Math.round(point[0] * 10) / 10, Math.round(point[1] * 10) / 10] as const
    const back = unproject(geo.projection, [rounded[0], rounded[1]])
    // 緯度 1 度 ≒ 111km、経度 1 度 ≒ 90km（北緯 35.8 度）
    expect(Math.abs(back.latitude - CITY_HALL.latitude) * 111_000).toBeLessThan(10)
    expect(Math.abs(back.longitude - CITY_HALL.longitude) * 90_000).toBeLessThan(10)
  })

  it('全町名の centroid を逆投影すると鎌ケ谷市の範囲に収まる', () => {
    for (const d of geo.districts) {
      const { latitude, longitude } = districtLatLng(geo.projection, d.centroid)
      expect(latitude).toBeGreaterThan(35.738)
      expect(latitude).toBeLessThan(35.804)
      expect(longitude).toBeGreaterThan(139.968)
      expect(longitude).toBeLessThan(140.029)
    }
  })
})
