/**
 * リンク共有用のアイキャッチ画像（OGP 画像, 1200x630）を生成する。
 *
 *   node scripts/build-og-image.mjs
 *
 * public/data/geo/kamagaya.json の市域・町丁の境界を描いた HTML を Playwright の Chromium で
 * スクリーンショットし、public/og-image.png に書き出す。
 * 文字はシステムフォント（macOS のヒラギノ丸ゴ）で描くため、macOS で実行する想定。
 * かまたんの公式画像は使用承認を得ていないため描かない（docs/kamatan-usage-notes.md）。
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const geo = JSON.parse(await readFile(`${root}public/data/geo/kamagaya.json`, 'utf8'))
const [, , vbWidth, vbHeight] = geo.viewBox

/** MultiPolygon 相当の座標配列を SVG の path d に変換する */
const toPath = (polygons) =>
  polygons
    .flatMap((polygon) => polygon.map((ring) => `M${ring.map(([x, y]) => `${x},${y}`).join('L')}Z`))
    .join('')

const districtPaths = geo.districts.map((d) => `<path d="${toPath(d.polygons)}" />`).join('')
const cityPath = toPath(geo.city.polygons)

// 地図の上に置く目印（カテゴリ色）。座標は viewBox 上の位置
const pins = [
  { x: 300, y: 330, color: '#4f8fe6' },
  { x: 470, y: 520, color: '#9c6ade' },
  { x: 360, y: 690, color: '#3fae6a' },
  { x: 540, y: 300, color: '#ff8a3d' },
]
const pinSvg = pins
  .map(
    ({ x, y, color }) => `
    <g transform="translate(${x} ${y}) scale(2.2)">
      <path d="M0 0c-9-12-16-19-16-28a16 16 0 0 1 32 0c0 9-7 16-16 28z" fill="${color}" stroke="#fff" stroke-width="3" />
      <circle cx="0" cy="-28" r="6" fill="#fff" />
    </g>`,
  )
  .join('')

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    font-family: 'Hiragino Maru Gothic ProN', 'Hiragino Maru Gothic Pro', 'BIZ UDPGothic', 'Noto Sans JP', sans-serif;
    color: #453830;
    background:
      radial-gradient(circle at 12% 18%, #fff4d6 0 140px, transparent 141px),
      radial-gradient(circle at 92% 88%, #b8e4ff 0 180px, transparent 181px),
      #fffdf7;
  }
  .frame { position: absolute; inset: 24px; border: 6px solid #ffa726; border-radius: 40px; }
  .map { position: absolute; right: 64px; top: 52px; height: 526px; }
  .map .land { fill: #c9efd5; }
  .map .districts path { fill: #c9efd5; stroke: #fff; stroke-width: 3; stroke-linejoin: round; }
  .map .city { fill: none; stroke: #4fb473; stroke-width: 7; stroke-linejoin: round; }
  .text { position: absolute; left: 76px; top: 104px; white-space: nowrap; }
  .badge {
    display: inline-flex; align-items: center; gap: 12px;
    background: #ffa726; color: #fff; font-size: 30px; font-weight: 700;
    padding: 10px 26px 10px 14px; border-radius: 999px;
  }
  h1 { margin-top: 26px; font-size: 88px; line-height: 1.12; font-weight: 700; letter-spacing: 0.01em; }
  h1 .small { display: block; font-size: 54px; color: #e08a0b; }
  h1 .accent { color: #e08a0b; }
  .lead { margin-top: 24px; font-size: 34px; font-weight: 700; color: #7d6b5f; }
  .chips { margin-top: 30px; display: flex; gap: 10px; }
  .chip { font-size: 24px; font-weight: 700; color: #fff; padding: 8px 18px; border-radius: 999px; }
</style>
</head>
<body>
  <div class="frame"></div>
  <svg class="map" viewBox="0 0 ${vbWidth} ${vbHeight}" xmlns="http://www.w3.org/2000/svg">
    <path class="land" d="${cityPath}" />
    <g class="districts">${districtPaths}</g>
    <path class="city" d="${cityPath}" />
    ${pinSvg}
  </svg>
  <div class="text">
    <div class="badge">
      <svg width="48" height="48" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="26" fill="#fff4d6" stroke="#fff" stroke-width="3" />
        <circle cx="28" cy="28" r="17" fill="#fff" stroke="#e5b56a" stroke-width="2" />
        <path d="M28 13 L33 28 L28 43 L23 28 Z" fill="#ffa726" />
        <path d="M28 13 L33 28 L23 28 Z" fill="#e08a0b" />
        <circle cx="28" cy="28" r="3" fill="#453830" />
      </svg>
      鎌ケ谷市 地理クイズ
    </div>
    <h1><span class="small">かまたんの</span>かまがや<span class="accent">大冒険！</span></h1>
    <p class="lead">学校・まち・施設を 地図でさがそう！</p>
    <div class="chips">
      <span class="chip" style="background:#4f8fe6">小学校</span>
      <span class="chip" style="background:#9c6ade">中学校</span>
      <span class="chip" style="background:#3fae6a">図書館</span>
      <span class="chip" style="background:#ff8a3d">児童センター</span>
      <span class="chip" style="background:#e0ac10">町名</span>
    </div>
  </div>
</body>
</html>`

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.setContent(html)
  await page.screenshot({ path: `${root}public/og-image.png`, type: 'png' })
} finally {
  await browser.close()
}
console.log('public/og-image.png を書き出しました')
