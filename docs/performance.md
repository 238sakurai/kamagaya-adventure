# パフォーマンス計測結果

計測日: 2026-10-16（Apple M4 Pro / macOS、本番ビルドを `vite preview` で配信）

バッテリー消費量そのものは実測していません。代わりに、転送量・リクエスト数・Lighthouse・
静止時の描画活動・連続プレイ時のメモリ推移を計測しています。実機（iPhone Safari / Android Chrome）での
確認は未実施です（下記「未実施」参照）。

## ビルドサイズ（`npm run build`）

| ファイル | 生サイズ | gzip |
|---|---|---|
| `assets/index-*.js`（React + Motion + アプリ） | 469.5 KB | **148.3 KB** |
| `assets/index-*.css`（Tailwind） | 26.3 KB | 5.9 KB |
| `data/geo/kamagaya.json`（市境 + 町名 31 + 町丁 92） | 138.0 KB | 44.2 KB |
| `index.html` | 1.1 KB | — |

- 初期 JavaScript は gzip 148KB で、目安の 200KB 以下。
- Web フォントは同梱しない（当初 Zen Maru Gothic のサブセットを同梱したところ、タイトル画面だけで
  31 ファイル・約 400KB を要求していたため廃止。端末の丸ゴシックを使う）。
- 画像・音声ファイルなし。タイトル画面の総リクエストは 5 件（HTML / JS / CSS / 地図 JSON / favicon）。

## Lighthouse（Chrome 156 headless、モバイル設定・シミュレーテッドスロットリング）

| 項目 | 値 |
|---|---|
| Performance | **98** |
| Accessibility | **100** |
| Best Practices | 100 |
| SEO | 100 |
| First Contentful Paint | 1.7 s |
| Largest Contentful Paint | 2.1 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0 |
| 総転送量 | 195 KiB |
| メインスレッド処理 | 0.5 s |

フォント同梱時は Performance 70 / FCP 4.7 s / 総転送量 596 KiB・36 リクエストだった。

## 静止時の描画活動（Playwright + CDP、5 秒間アイドル）

`requestAnimationFrame` と `setTimeout` の呼び出し回数、`document.getAnimations()` の実行中件数、
レイアウト回数・スタイル再計算回数・スクリプト実行時間を計測。

| 状態 | rAF | timers | 実行中アニメーション | layout | style recalc | script |
|---|---|---|---|---|---|---|
| クイズ画面（出題中・無操作） | 0 | 0 | 0 | 0 | 0 | 0.2 ms |
| タイトル画面（6 ゲーム後、紙吹雪終了後） | 0 | 0 | 0 | 0 | 0 | 0.2 ms |
| タイトル画面（初回表示直後） | 0 | 0 | 2（終了待ちの CSS トランジション） | 1 | 11 | 14 ms |

静止中に継続する処理はない。初回表示直後の 2 件は地図描画時の `fill` トランジションで、5 秒以内に終了する。

## 連続プレイ時のメモリ（学校クイズ 10 問 × 6 ゲーム、各ゲーム後に GC してから計測）

| ゲーム | JS ヒープ | DOM ノード | イベントリスナー |
|---|---|---|---|
| 1 | 5.30 MB | 120 | 168 |
| 2 | 5.46 MB | 120 | 168 |
| 3 | 5.51 MB | 120 | 168 |
| 4 | 5.57 MB | 120 | 168 |
| 5 | 5.63 MB | 120 | 168 |
| 6 | 5.67 MB | 120 | 168 |

DOM ノード数・リスナー数は一定で、紙吹雪やシートなどの一時要素は確実に解放されている。ヒープの微増
（計 +0.37 MB、ゲームあたり 0.04〜0.16 MB で逓減）はプレイ履歴（最大 50 件で打ち切り）と保存データの
JSON 文字列によるもので、上限がある。

## 省電力の実装

- 地図は SVG。`viewBox` の変更は操作時のみ。ピンは `transform` だけで位置と大きさを決める。
- 常時アニメーションなし。正解時の紙吹雪は 24 個・約 2.2 秒で DOM から削除。出題区域の点滅は 3 回で停止。
- ボタンの押し込みは CSS のみ。画面遷移アニメーションなし。
- タブ非表示中はチャレンジのタイマー（`setInterval` 200ms）を解除し、非表示時間を計測から除外。
- 省電力モード（設定）: `<html class="power-save">` と Motion の `reducedMotion="always"` で装飾アニメーションを停止、紙吹雪を「✨」1 文字の簡易表示に。`prefers-reduced-motion` も同じ扱い。
- 地理データは 1 ファイルを初回のみ取得しメモリにキャッシュ。GPS・センサー・外部 API は使わない。

## 再計測の方法

```bash
npm run build && npm run preview -- --host 127.0.0.1 --port 4174
# 別ターミナルで
npx lighthouse http://127.0.0.1:4174/kamagaya-adventure/ --form-factor=mobile --screenEmulation.mobile --view
```

静止時の描画・メモリの計測スクリプトは Playwright + CDP（`Performance.getMetrics`、`HeapProfiler.collectGarbage`）で、
`requestAnimationFrame` / `setTimeout` をラップして呼び出し回数を数える方式。

## 未実施

- 実機 iPhone Safari / Android Chrome での操作感・Lighthouse 計測
- バッテリー消費量の実測
