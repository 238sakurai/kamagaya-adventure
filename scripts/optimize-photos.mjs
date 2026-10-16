#!/usr/bin/env node
/**
 * 図鑑・クイズに出す写真を、ゲーム用の軽量な WebP に変換して public/images/entries/ に置く。
 *
 *   node scripts/optimize-photos.mjs <入力画像> <項目ID>   … 1 枚だけ変換
 *   node scripts/optimize-photos.mjs                       … data/photos/<項目ID>.(jpg|jpeg|png|heic|webp|svg) をまとめて変換
 *
 * 処理内容
 *   1. EXIF の向きを反映して回転し、メタデータ（撮影場所の GPS など）をすべて削除する
 *   2. 長辺が MAX_WIDTH px を超えるときだけ縮小する（拡大はしない）
 *   3. WebP（品質 QUALITY）で書き出し、MAX_BYTES を超えたら品質を下げて再試行する
 *   4. src/data/*.ts に貼り付ける `photo:` の雛形を表示する（alt / credit / license は手で埋める）
 *
 * SVG はそのままコピーする（サイズ上限のみ確認）。写真の利用条件は docs/photos.md を参照。
 */
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const RAW_DIR = join(ROOT, 'data', 'photos')
const OUT_DIR = join(ROOT, 'public', 'images', 'entries')

/** 幅の上限。スマートフォンの画面幅（最大 512px のカード）を 1.25 倍程度でカバーする */
export const MAX_WIDTH = 640
/** 1 枚あたりのサイズ上限（地図データ gzip 44KB と同程度まで） */
export const MAX_BYTES = 80 * 1024
const QUALITY = 72
const MIN_QUALITY = 45
const RASTER = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.avif', '.tif', '.tiff'])

function assertId(id) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`項目 ID は英小文字・数字・ハイフンのみ: ${id}`)
}

async function convertRaster(input, id) {
  const out = join(OUT_DIR, `${id}.webp`)
  let quality = QUALITY
  for (;;) {
    const info = await sharp(input, { failOn: 'none' })
      .rotate() // EXIF の向きを反映
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality, effort: 6 }) // メタデータは既定で削除される
      .toFile(out)
    if (info.size <= MAX_BYTES || quality <= MIN_QUALITY) return { src: `images/entries/${id}.webp`, width: info.width, height: info.height, bytes: info.size, quality }
    quality -= 8
  }
}

async function copySvg(input, id) {
  const out = join(OUT_DIR, `${id}.svg`)
  await copyFile(input, out)
  const { size } = await stat(out)
  const meta = await sharp(input).metadata()
  return { src: `images/entries/${id}.svg`, width: meta.width ?? 0, height: meta.height ?? 0, bytes: size, quality: null }
}

async function convert(input, id) {
  assertId(id)
  const ext = extname(input).toLowerCase()
  const result = ext === '.svg' ? await copySvg(input, id) : RASTER.has(ext) ? await convertRaster(input, id) : null
  if (!result) throw new Error(`対応していない形式: ${input}`)
  const kb = (result.bytes / 1024).toFixed(1)
  const over = result.bytes > MAX_BYTES ? `  ⚠ ${MAX_BYTES / 1024}KB を超えています（被写体を絞ってトリミングするか、幅を減らしてください）` : ''
  console.log(`${id}: ${result.src}  ${result.width}×${result.height}  ${kb}KB${result.quality ? `  q=${result.quality}` : ''}${over}`)
  console.log(`  photo: { src: '${result.src}', alt: '', width: ${result.width}, height: ${result.height}, credit: '', license: '', takenAt: '' },`)
  return result
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const [input, id] = process.argv.slice(2)
  if (input) {
    if (!id) throw new Error('使い方: node scripts/optimize-photos.mjs <入力画像> <項目ID>')
    await convert(input, id)
    return
  }
  let files
  try {
    files = (await readdir(RAW_DIR)).filter((f) => !f.startsWith('.')).sort()
  } catch {
    throw new Error(`${RAW_DIR} がありません。<項目ID>.jpg のような名前で写真を置いてください`)
  }
  if (files.length === 0) {
    console.log(`${RAW_DIR} に写真がありません`)
    return
  }
  for (const f of files) await convert(join(RAW_DIR, f), basename(f, extname(f)))
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
