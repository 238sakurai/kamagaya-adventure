import type { ProjectionMeta, Point } from '../types'
import { unproject } from './geo'

/**
 * Google マップ / ストリートビューの URL を組み立てる。
 * リンク用の URL は API キー不要で、新しいタブで開くだけ（省電力・規約の都合）。
 * 埋め込み用の URL（Maps Embed API）はキーが必要で、タップしたときだけ iframe で読み込む。
 * URL の形式:
 *  - リンク: https://developers.google.com/maps/documentation/urls/get-started
 *  - 埋め込み: https://developers.google.com/maps/documentation/embed/embedding-map#streetview_mode
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

/**
 * Maps Embed API のストリートビュー（iframe の src）。
 * キーは公開サイトに埋め込まれるので、Google Cloud 側で HTTP リファラー制限をかけること。
 */
export function streetViewEmbedUrl(key: string, latitude: number, longitude: number): string {
  return `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(key)}&location=${query({ latitude, longitude })}`
}

/** 町名は緯度経度を持たないので、地図データの centroid（viewBox 座標）を逆投影して使う */
export function districtLatLng(meta: ProjectionMeta, centroid: Point): LatLng {
  return unproject(meta, centroid)
}
