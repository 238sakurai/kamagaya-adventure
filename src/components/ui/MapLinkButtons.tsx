import type { ReactNode } from 'react'
import { googleMapsUrl, streetViewUrl, type LatLng } from '../../lib/mapLinks'
import { ExternalLink } from './ExternalLink'

interface MapLinkButtonsProps {
  coords: LatLng
  /** 町名など、ピンポイントの地点でないものは false にしてストリートビューを出さない */
  streetView?: boolean
  className?: string
  /** data-testid の接頭辞（複数画面で区別したいとき） */
  testIdPrefix?: string
  /** ボタンの列の先頭に置く要素（ストリートビューの埋め込みボタンなど） */
  leading?: ReactNode
  /** ボタンの列と注記の間に置く要素（埋め込みの枠など） */
  children?: ReactNode
  /** クイズの解説カードなど高さを抑えたい場所では注記を省く */
  compact?: boolean
}

/** 小さなチップ型のリンク。解説カードや図鑑で地図を隠さないよう高さ 36px に抑える */
export const MAP_CHIP = 'btn-pop focus-ring inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-bold text-ink no-underline'

/**
 * Google マップ / ストリートビューを新しいタブで開くリンク。
 * 写真の代わりに探検の目印として使う。画像や API は読み込まず、リンクだけ。
 */
export function MapLinkButtons({ coords, streetView = true, className = '', testIdPrefix = '', leading, children, compact = false }: MapLinkButtonsProps) {
  return (
    <div className={className} data-testid={`${testIdPrefix}map-links`}>
      <div className="flex flex-wrap items-center gap-1.5">
        {leading}
        <ExternalLink href={googleMapsUrl(coords)} className={`${MAP_CHIP} bg-mint`} data-testid={`${testIdPrefix}map-link`}>
          <span aria-hidden="true">🗺</span>
          Google マップ
          <span aria-hidden="true">↗</span>
          <span className="sr-only">でみる（新しいタブで開きます）</span>
        </ExternalLink>
        {streetView && (
          <ExternalLink href={streetViewUrl(coords)} className={`${MAP_CHIP} bg-sun`} data-testid={`${testIdPrefix}streetview-link`}>
            <span aria-hidden="true">👀</span>
            ストリートビュー
            <span aria-hidden="true">↗</span>
            <span className="sr-only">でみる（新しいタブで開きます）</span>
          </ExternalLink>
        )}
      </div>
      {children}
      {!compact && <p className="mt-1 text-[10px] leading-snug text-ink-soft">Google の サービスが あたらしいタブで ひらきます</p>}
    </div>
  )
}
