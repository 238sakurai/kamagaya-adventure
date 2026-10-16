import { googleMapsUrl, streetViewUrl, type LatLng } from '../../lib/mapLinks'
import { ExternalLink } from './ExternalLink'

interface MapLinkButtonsProps {
  coords: LatLng
  /** 町名など、ピンポイントの地点でないものは false にしてストリートビューを出さない */
  streetView?: boolean
  className?: string
  /** data-testid の接頭辞（複数画面で区別したいとき） */
  testIdPrefix?: string
}

const BUTTON = 'btn-pop inline-flex min-h-12 items-center justify-center gap-2 rounded-3xl px-5 text-base font-bold text-ink no-underline'

/**
 * Google マップ / ストリートビューを新しいタブで開くボタン。
 * 写真の代わりに探検の目印として使う。画像や API は読み込まず、リンクだけ。
 */
export function MapLinkButtons({ coords, streetView = true, className = '', testIdPrefix = '' }: MapLinkButtonsProps) {
  return (
    <div className={className} data-testid={`${testIdPrefix}map-links`}>
      <div className="flex flex-wrap gap-2">
        <ExternalLink href={googleMapsUrl(coords)} className={`${BUTTON} bg-mint`} data-testid={`${testIdPrefix}map-link`}>
          <span aria-hidden="true">🗺</span>
          Google マップでみる
          <span aria-hidden="true">↗</span>
          <span className="sr-only">（新しいタブで開きます）</span>
        </ExternalLink>
        {streetView && (
          <ExternalLink href={streetViewUrl(coords)} className={`${BUTTON} bg-sun`} data-testid={`${testIdPrefix}streetview-link`}>
            <span aria-hidden="true">👀</span>
            ストリートビューでみる
            <span aria-hidden="true">↗</span>
            <span className="sr-only">（新しいタブで開きます）</span>
          </ExternalLink>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
        Google マップが あたらしいタブで ひらきます（このゲームとは べつの サービスです）
      </p>
    </div>
  )
}
