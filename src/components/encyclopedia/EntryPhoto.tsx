import { useState } from 'react'
import { photoUrl } from '../../lib/photos'
import type { EntryPhoto as EntryPhotoData } from '../../types'
import { ExternalLink } from '../ui/ExternalLink'

interface EntryPhotoProps {
  photo: EntryPhotoData
  /** md: 図鑑の詳細（実寸比で全幅）、sm: クイズの解説（高さ固定の帯） */
  size?: 'sm' | 'md'
  className?: string
  testId?: string
}

/**
 * 探検の目印になる写真。
 * - width / height を指定して、読み込み前から場所を確保する（レイアウトのずれなし）
 * - loading="lazy" / decoding="async" で、画面外や未発見のときは通信しない
 * - 読み込みに失敗したら表示しない（文章だけでも遊べる）
 */
export function EntryPhoto({ photo, size = 'md', className = '', testId = 'entry-photo' }: EntryPhotoProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  const small = size === 'sm'
  return (
    <figure className={`overflow-hidden rounded-2xl bg-cream ${className}`} data-testid={testId}>
      <img
        src={photoUrl(photo)}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={small ? 'block h-32 w-full object-cover' : 'block h-auto w-full'}
        style={small ? undefined : { aspectRatio: `${photo.width} / ${photo.height}` }}
      />
      <figcaption className="px-3 py-1.5 text-[11px] leading-relaxed text-ink-soft">
        <span aria-hidden="true">📷 </span>
        {photo.sourceUrl ? (
          <ExternalLink href={photo.sourceUrl} className="underline">
            {photo.credit}
          </ExternalLink>
        ) : (
          photo.credit
        )}
        （{photo.license}）{photo.takenAt && `・${photo.takenAt} 撮影`}
      </figcaption>
    </figure>
  )
}
