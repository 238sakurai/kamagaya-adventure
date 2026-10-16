import type { ProjectionMeta, Point } from '../types'
import { unproject } from './geo'

/**
 * Google マップ / ストリートビューへのリンク URL を組み立てる。
 * API キーや画像・スクリプトの読み込みは行わず、URL を新しいタブで開くだけ（省電力・規約の都合）。
 * URL の形式: https://developers.google.com/maps/documentation/urls/get-started
 */

export interface LatLng {
  latitude: number
  longitude: number
}

/** 小数 6 桁（約 0.1m）に丸めて URL を短く・安定させる */
const fmt = (n: number) => n.toFixed(6)

const query = ({ latitude, longitude }: LatLng) => `${fmt(latitude)},${fmt(longitude)}`

/** 地図上にピンを立てて開く */
export function googleMapsUrl(coords: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${query(coords)}`
}

/** その地点に最も近いストリートビューを開く */
export function streetViewUrl(coords: LatLng): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${query(coords)}`
}

/** 町名は緯度経度を持たないので、地図データの centroid（viewBox 座標）を逆投影して使う */
export function districtLatLng(meta: ProjectionMeta, centroid: Point): LatLng {
  return unproject(meta, centroid)
}
