import type { ReactNode } from 'react'
import { googleMapsUrl, type LatLng } from '../../lib/mapLinks'
import { ExternalLink } from './ExternalLink'

interface MapLinkButtonsProps {
  coords: LatLng
  className?: string
  /** data-testid の接頭辞（複数画面で区別したいとき） */
  testIdPrefix?: string
  /** ボタンの列の先頭に置く要素（ストリートビューの埋め込みボタンなど） */
  leading?: ReactNode
  /** ボタンの列と注記の間に置く要素（埋め込みの枠など） */
  children?: ReactNode
}

/** 小さめのチップ型ボタン。解説カードや図鑑の本文を邪魔しない大きさにする */
export const MAP_BUTTON = 'btn-pop inline-flex min-h-9 items-center justify-center gap-1 rounded-2xl px-3 text-sm font-bold text-ink no-underline'

/**
 * Google マップを新しいタブで開く小さなボタン。
 * 写真の代わりに探検の目印として使う。画像や API は読み込まず、リンクだけ。
 */
export function MapLinkButtons({ coords, className = '', testIdPrefix = '', leading, children }: MapLinkButtonsProps) {
  return (
    <div className={className} data-testid={`${testIdPrefix}map-links`}>
      <div className="flex flex-wrap gap-2">
        {leading}
        <ExternalLink href={googleMapsUrl(coords)} className={`${MAP_BUTTON} bg-mint`} data-testid={`${testIdPrefix}map-link`}>
          <span aria-hidden="true">🗺</span>
          Google マップでみる
          <span aria-hidden="true">↗</span>
          <span className="sr-only">（新しいタブで開きます）</span>
        </ExternalLink>
      </div>
      {children}
      <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">Google マップは あたらしいタブで ひらきます（このゲームとは べつの サービスです）</p>
    </div>
  )
}
