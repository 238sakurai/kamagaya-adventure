import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { DISTRICTS, FACILITIES } from '../../src/data/facilities'
import type { EntryPhoto } from '../../src/types'

/** scripts/optimize-photos.mjs と同じ上限 */
const MAX_WIDTH = 640
const MAX_BYTES = 80 * 1024

const entries: { id: string; name: string; photo: EntryPhoto }[] = [...FACILITIES, ...DISTRICTS].flatMap((e) => (e.photo ? [{ id: e.id, name: e.name, photo: e.photo }] : []))

describe('写真データ', () => {
  it('写真の項目は public/images/entries/ の軽量なファイルを指し、説明と出典がある', async () => {
    for (const { id, name, photo } of entries) {
      expect(photo.src, name).toMatch(/^images\/entries\/[a-z0-9-]+\.(webp|avif|svg|png|jpg)$/)
      const file = resolve(process.cwd(), 'public', photo.src)
      expect(existsSync(file), `${name} の写真 ${photo.src} がない`).toBe(true)
      expect(statSync(file).size, `${name} の写真が ${MAX_BYTES / 1024}KB を超えている`).toBeLessThanOrEqual(MAX_BYTES)

      expect(photo.alt.trim().length, `${name} の alt`).toBeGreaterThan(0)
      expect(photo.credit.trim().length, `${name} の credit`).toBeGreaterThan(0)
      expect(photo.license.trim().length, `${name} の license`).toBeGreaterThan(0)
      if (photo.sourceUrl) expect(photo.sourceUrl, name).toMatch(/^https:\/\//)
      if (photo.takenAt) expect(photo.takenAt, name).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      expect(Number.isInteger(photo.width) && photo.width > 0, `${name} の width`).toBe(true)
      expect(Number.isInteger(photo.height) && photo.height > 0, `${name} の height`).toBe(true)
      expect(photo.width, `${name} の幅が ${MAX_WIDTH}px を超えている`).toBeLessThanOrEqual(MAX_WIDTH)
      const meta = await sharp(file).metadata()
      expect({ width: meta.width, height: meta.height }, `${name} の width/height が実際の画像と違う`).toEqual({ width: photo.width, height: photo.height })

      // ID と一致しないファイル名は取り違えの可能性が高い
      expect(photo.src, `${name} の写真ファイル名が ID と違う`).toContain(`/${id}.`)
    }
  })
})
