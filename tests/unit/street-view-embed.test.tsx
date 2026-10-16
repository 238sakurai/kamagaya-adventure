import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StreetViewEmbed } from '../../src/components/ui/StreetViewEmbed'
import { streetViewEmbedUrl } from '../../src/lib/mapLinks'

// 鎌ケ谷市役所付近
const COORDS = { latitude: 35.776611, longitude: 140.000778 }

const iframe = () => document.querySelector('iframe')

describe('StreetViewEmbed', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('キーなし: 埋め込みボタンも iframe もなく、Google マップのリンクだけ出す', () => {
    render(<StreetViewEmbed coords={COORDS} name="鎌ケ谷市役所" apiKey="" />)
    expect(screen.queryByTestId('streetview-embed-button')).toBeNull()
    expect(iframe()).toBeNull()
    expect(screen.getByTestId('map-link')).toHaveAttribute('target', '_blank')
    expect(screen.queryByTestId('streetview-link')).toBeNull()
  })

  it('キーは省略時に VITE_GOOGLE_MAPS_EMBED_KEY から読む', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_KEY', 'env-key')
    render(<StreetViewEmbed coords={COORDS} name="鎌ケ谷市役所" />)
    expect(screen.getByTestId('streetview-embed-button')).toBeInTheDocument()
  })

  it('キーあり・タップ前: 先頭に埋め込みボタンと注記、Google マップのリンクも残り、iframe はない', () => {
    render(<StreetViewEmbed coords={COORDS} name="鎌ケ谷市役所" apiKey="dummy" />)
    const button = screen.getByRole('button', { name: 'ストリートビューを ここで見る' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByTestId('streetview-embed-note')).toHaveTextContent('Google に せつぞくするよ')
    expect(iframe()).toBeNull()
    // 埋め込みボタンがリンクより先に並ぶ
    const row = button.parentElement!
    expect(row.firstElementChild).toBe(button)
    expect(row.contains(screen.getByTestId('map-link'))).toBe(true)
    expect(row.children).toHaveLength(2)
  })

  it('タップ後: 正しい src の iframe が 16:9 の枠に出て、「とじる」で外れる', () => {
    render(<StreetViewEmbed coords={COORDS} name="鎌ケ谷市役所" apiKey="dummy" />)
    fireEvent.click(screen.getByRole('button', { name: 'ストリートビューを ここで見る' }))

    const frame = iframe()
    expect(frame).not.toBeNull()
    expect(frame).toHaveAttribute('src', streetViewEmbedUrl('dummy', COORDS.latitude, COORDS.longitude))
    expect(frame).toHaveAttribute('src', 'https://www.google.com/maps/embed/v1/streetview?key=dummy&location=35.776611,140.000778')
    expect(frame).toHaveAttribute('title', '鎌ケ谷市役所のストリートビュー')
    expect(frame).toHaveAttribute('loading', 'lazy')
    expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer-when-downgrade')
    expect(frame).toHaveAttribute('allowfullscreen')
    expect(screen.getByTestId('streetview-embed')).toHaveClass('aspect-video')
    expect(screen.queryByTestId('streetview-embed-note')).toBeNull()

    const close = screen.getByRole('button', { name: 'ストリートビューを とじる' })
    expect(close).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(close)
    expect(iframe()).toBeNull()
    expect(screen.getByRole('button', { name: 'ストリートビューを ここで見る' })).toBeInTheDocument()
  })

  it('町名（streetView=false）はキーがあっても埋め込みボタンを出さない', () => {
    render(<StreetViewEmbed coords={COORDS} name="丸山" streetView={false} apiKey="dummy" />)
    expect(screen.queryByTestId('streetview-embed-button')).toBeNull()
    expect(iframe()).toBeNull()
    expect(screen.getByTestId('map-link')).toBeInTheDocument()
  })

  it('testIdPrefix が data-testid に付く', () => {
    render(<StreetViewEmbed coords={COORDS} name="鎌ケ谷市役所" apiKey="dummy" testIdPrefix="feedback-" />)
    expect(screen.getByTestId('feedback-streetview-embed-button')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-map-link')).toBeInTheDocument()
  })
})
