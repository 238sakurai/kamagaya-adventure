import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EntryPhoto } from '../../src/components/encyclopedia/EntryPhoto'
import { photoUrl } from '../../src/lib/photos'
import type { EntryPhoto as EntryPhotoData } from '../../src/types'

const photo: EntryPhotoData = {
  src: 'images/entries/library-main.webp',
  alt: '図書館本館の正面入口',
  width: 640,
  height: 480,
  credit: '撮影: さくらい',
  license: '撮影者の許諾',
  takenAt: '2026-10-16',
}

describe('EntryPhoto', () => {
  it('遅延読み込みで、実寸を指定した img とクレジットを出す', () => {
    render(<EntryPhoto photo={photo} />)
    const img = screen.getByRole('img', { name: photo.alt })
    expect(img).toHaveAttribute('src', photoUrl(photo))
    expect(img.getAttribute('src')).toMatch(/\/images\/entries\/library-main\.webp$/)
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('width', '640')
    expect(img).toHaveAttribute('height', '480')
    expect(screen.getByTestId('entry-photo')).toHaveTextContent('撮影: さくらい（撮影者の許諾）・2026-10-16 撮影')
  })

  it('入手元 URL があればクレジットがリンクになる', () => {
    render(<EntryPhoto photo={{ ...photo, sourceUrl: 'https://example.com/photo', credit: 'Example', license: 'CC BY 4.0' }} />)
    const link = screen.getByRole('link', { name: 'Example' })
    expect(link).toHaveAttribute('href', 'https://example.com/photo')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('読み込みに失敗したら何も表示しない', () => {
    render(<EntryPhoto photo={photo} />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByTestId('entry-photo')).toBeNull()
  })
})
