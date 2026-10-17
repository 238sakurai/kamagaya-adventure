import { useState } from 'react'
import { streetViewEmbedUrl, type LatLng } from '../../lib/mapLinks'
import { MAP_CHIP, MapLinkButtons } from './MapLinkButtons'

interface StreetViewEmbedProps {
  coords: LatLng
  /** iframe の title に使う施設名 */
  name: string
  /** 町名など、ピンポイントの地点でないものは false にして埋め込みもリンクも出さない */
  streetView?: boolean
  className?: string
  /** data-testid の接頭辞（複数画面で区別したいとき） */
  testIdPrefix?: string
  /** Maps Embed API のキー。省略時はビルド時の VITE_GOOGLE_MAPS_EMBED_KEY（テスト用に差し替え可） */
  apiKey?: string
  /** クイズの解説カードなど高さを抑えたい場所では注記を省く */
  compact?: boolean
}

/**
 * 探検の目印: Google マップ / ストリートビューのリンクに加えて、
 * API キーがあるときだけ「ストリートビューを ここで見る」ボタンを先頭に置く。
 * iframe はタップするまで置かず（通信も描画も発生しない）、「とじる」で外す。
 * キーが未設定のときは MapLinkButtons（リンクだけ）と同じ表示になる。
 */
export function StreetViewEmbed({ coords, name, streetView = true, className = '', testIdPrefix = '', apiKey, compact = false }: StreetViewEmbedProps) {
  const key = apiKey ?? import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY ?? ''
  const [open, setOpen] = useState(false)
  const canEmbed = streetView && key !== ''

  if (!canEmbed) {
    return <MapLinkButtons coords={coords} streetView={streetView} className={className} testIdPrefix={testIdPrefix} compact={compact} />
  }

  return (
    <MapLinkButtons
      coords={coords}
      streetView
      className={className}
      testIdPrefix={testIdPrefix}
      compact={compact}
      leading={
        <button
          type="button"
          className={`${MAP_CHIP} bg-sky`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'ストリートビューを とじる' : 'ストリートビューを ここで見る'}
          data-testid={`${testIdPrefix}streetview-embed-button`}
        >
          <span aria-hidden="true">{open ? '✕' : '👀'}</span>
          {open ? 'とじる' : 'ここで見る'}
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
        !compact && (
          <p className="mt-1 text-[10px] leading-snug text-ink-soft" data-testid={`${testIdPrefix}streetview-embed-note`}>
            「ここで見る」を タップすると Google に せつぞくするよ
          </p>
        )
      )}
    </MapLinkButtons>
  )
}
