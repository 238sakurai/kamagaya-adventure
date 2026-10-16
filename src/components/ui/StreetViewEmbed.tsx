import { useState } from 'react'
import { streetViewEmbedUrl, type LatLng } from '../../lib/mapLinks'
import { MAP_BUTTON, MapLinkButtons } from './MapLinkButtons'

interface StreetViewEmbedProps {
  coords: LatLng
  /** iframe の title に使う施設名 */
  name: string
  /** 町名など、ピンポイントの地点でないものは false にして埋め込みを出さない */
  streetView?: boolean
  className?: string
  /** data-testid の接頭辞（複数画面で区別したいとき） */
  testIdPrefix?: string
  /** Maps Embed API のキー。省略時はビルド時の VITE_GOOGLE_MAPS_EMBED_KEY（テスト用に差し替え可） */
  apiKey?: string
}

/**
 * 探検の目印: Google マップのリンクに加えて、
 * API キーがあるときだけ「ストリートビューを ここで見る」ボタンを先頭に置く。
 * iframe はタップするまで置かず（通信も描画も発生しない）、「とじる」で外す。
 * キーが未設定のときは MapLinkButtons（Google マップのリンクだけ）と同じ表示になる。
 */
export function StreetViewEmbed({ coords, name, streetView = true, className = '', testIdPrefix = '', apiKey }: StreetViewEmbedProps) {
  const key = apiKey ?? import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY ?? ''
  const [open, setOpen] = useState(false)
  const canEmbed = streetView && key !== ''

  if (!canEmbed) {
    return <MapLinkButtons coords={coords} className={className} testIdPrefix={testIdPrefix} />
  }

  return (
    <MapLinkButtons
      coords={coords}
      className={className}
      testIdPrefix={testIdPrefix}
      leading={
        <button type="button" className={`${MAP_BUTTON} focus-ring bg-sky`} onClick={() => setOpen((v) => !v)} aria-expanded={open} data-testid={`${testIdPrefix}streetview-embed-button`}>
          <span aria-hidden="true">{open ? '✕' : '👀'}</span>
          {open ? 'ストリートビューを とじる' : 'ストリートビューを ここで見る'}
        </button>
      }
    >
      {open ? (
        <div className="mt-2 aspect-video w-full overflow-hidden rounded-2xl bg-sky/30" data-testid={`${testIdPrefix}streetview-embed`}>
          <iframe
            src={streetViewEmbedUrl(key, coords.latitude, coords.longitude)}
            title={`${name}のストリートビュー`}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft" data-testid={`${testIdPrefix}streetview-embed-note`}>
          「ここで見る」を タップすると Google に せつぞくするよ
        </p>
      )}
    </MapLinkButtons>
  )
}
