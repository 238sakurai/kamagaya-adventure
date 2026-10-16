# かまたんの かまがや大冒険！

**学校・まち・施設をさがそう！** — 千葉県鎌ケ谷市の学校・町名・図書館・児童センターを、地図で遊びながら覚える子ども向けの地理学習ゲームです。

- 公開 URL: https://238sakurai.github.io/kamagaya-adventure/
- 本アプリは鎌ケ谷市の公式事業ではない、個人制作の**非公式**地域学習ゲームです。

## 遊び方

| モード | 内容 |
|---|---|
| 🏫 がっこうはど〜こだ？ | 学校名を聞いて地図のピンをタップ。小学校 9 校・中学校 5 校（切り替え可）。10 問 |
| 🏘️ まちの名前をあてよう！ | 光った区域の町名を 4 択で回答。31 町。10 問 |
| 📚 としょかん・児童センター探し | 図書館 6・児童センター 6 の場所をタップ。正解すると施設紹介と公式サイトへのリンク |
| 🧭 かまがや探検 | クイズではなく自由に地図をタップして発見。見つけたものは図鑑に登録 |
| ⏱️ かまがやマスター！ | 60 秒タイムアタック。学校・町名・施設がランダム。ハイスコアと称号 |

- 正解 100 点、連続正解でボーナス（最大 +100）。ヒントを使うとボーナスなし。
- 📖 **かまがや図鑑**: 発見済み 57 項目（学校 14・図書館 6・児童センター 6・町名 31）を管理。各項目に所在地・紹介・公式サイトリンク・出典・確認日。項目ごとに探検の目印になる写真を 1 枚載せられる（`docs/photos.md`）。
- 🏫 **わたしの学校**: 小学校を 1 つ選ぶと、地図のハイライトと近くの図書館・児童センター（直線距離）を表示。通学区域とは無関係であることを明記。
- 称号（10 問モード）: 0〜3 問 たんけんのたまご / 4〜6 問 たんけんか / 7〜9 問 ものしり博士 / 10 問 かまがやマスター！

## 技術スタック

Vite 8 / React 19 / TypeScript / Tailwind CSS 4 / Motion / SVG / GeoJSON（ビルド時に TopoJSON で単純化）/ localStorage / Vitest / Playwright / GitHub Actions / GitHub Pages

完全な静的サイトで、サーバー・DB・ログイン・外部 API への実行時依存はありません。

## ローカルで動かす

```bash
npm ci
npm run dev        # http://localhost:5173/kamagaya-adventure/
```

```bash
npm run build      # dist/ に出力
npm run preview
```

## テスト

```bash
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm test           # Vitest（データ・ジオメトリ・出題・採点・保存・タイマー）
npm run test:e2e   # Playwright（ビルドして preview で実行。Desktop Chrome / Pixel 7）
```

## 地理データの生成

```bash
npm run data:geo   # data/source/*.geojson → public/data/geo/kamagaya.json
```

`data/source/` に鎌ケ谷市分だけ抽出した元データを同梱しています（出典は `data/source/README.md`）。
Web メルカトル投影 → viewBox 高さ 1000 に正規化 → TopoJSON で境界を共有したまま単純化 → 丁目を町名単位にマージ、という手順で約 138KB（gzip 44KB）の JSON にしています。

## 写真の追加

```bash
npm run photos:optimize   # data/photos/<項目ID>.jpg → public/images/entries/<項目ID>.webp（幅 640px・80KB 以下、EXIF 削除）
```

図鑑の詳細とクイズの解説に、探検の目印になる写真を項目ごとに 1 枚載せられます。`src/data/*.ts` の `photo` に
パス・実寸・alt・クレジット・利用条件を記録し、ユニットテストがサイズ上限と記入漏れを検査します。
写真は遅延読み込みで、未発見の項目や画面外では通信しません。手順と利用条件は `docs/photos.md`。

## GitHub Pages への公開

`main` への push で `.github/workflows/deploy.yml` が 型チェック → lint → Vitest → build → Pages デプロイ を実行します（`workflow_dispatch` で手動実行も可）。
リポジトリの Settings → Pages で **Source: GitHub Actions** を選んでください。

base パスは `vite.config.ts` が `GITHUB_REPOSITORY` から自動で `/kamagaya-adventure/` を決めます。別の場所に置くときは `BASE_PATH=/` などを指定します。画面遷移は React の state で行い、サブパスでのリロードでも 404 になりません。

## データの出典と管理方針

### 地図

- 市境: 国土数値情報 行政区域データ（N03）令和6年版 国土交通省（CC BY 4.0）
- 町丁境界: 令和2年国勢調査 小地域境界データ 総務省統計局（e-Stat、政府標準利用規約 2.0）
- いずれも加工（抽出・投影・単純化・統合）。統計上の小地域であり、住居表示や通学区域の境界とは一致しません。

### 学校・施設

- 学校 14 校: 鎌ケ谷市公式サイト 施設案内、各校の公式ホームページ（swa.kamagaya.ed.jp）、令和8年度 児童生徒数一覧。位置は国土数値情報 学校データ（P29、令和5年度）
- 図書館 6 館: 鎌ケ谷市立図書館 施設案内。位置は国土地理院 地名検索 API（住所検索）
- 児童センター 6 施設: 鎌ケ谷市公式サイト 施設案内。位置は国土地理院 地名検索 API（番地まで一致しない 3 施設は市の施設案内マップのデータ）
- 町名 31: 日本郵便 郵便番号検索、鎌ケ谷市 住居表示実施地区一覧、町丁字別人口

各項目の `sourceUrl` / `coordSource` / `verifiedAt`（2026-10-16）を `src/data/*.ts` に記録し、図鑑の詳細から参照できます。
ユニットテストで「施設の座標がその町名の区域内にある」ことを検証しています。

### 公式 URL

- 学校: 市の施設紹介ページ（`municipalUrl`）と学校ホームページ（`officialUrl`）の両方を保存。
- 図書館: 分館ごとの個別ページがないため、図書館サイトの施設案内ページ内アンカーを採用。
- 児童センター: 市公式サイトの各施設ページ。
- すべて 2026-10-16 時点で HTTP 200 を確認。推測で生成した URL はありません。公式 URL のない項目（町名）はボタンを表示しません。
- 外部リンクは `target="_blank" rel="noopener noreferrer"` で開き、ゲームの状態を保ちます。
- 探検の目印として、図鑑の詳細とクイズの解説に Google マップへの小さなリンクボタンを置いています（`src/lib/mapLinks.ts`）。公式サイトや地図サービスの画像は転載せず、緯度経度だけで組み立てた URL を新しいタブで開きます。町名は地図データの重心（centroid）を逆投影した座標です。
- ビルド時に `VITE_GOOGLE_MAPS_EMBED_KEY`（Google Maps Embed API のキー）があると、施設に「ストリートビューを ここで見る」ボタンが先頭に加わり、タップしたときだけストリートビューを画面内の iframe に表示します（`src/components/ui/StreetViewEmbed.tsx`）。キーは公開 JS に含まれるので、Google Cloud で HTTP リファラーを公開 URL に制限してください（`.env.example`）。本番は GitHub Secrets の `GOOGLE_MAPS_EMBED_KEY` から渡します。キー未設定なら Google マップのリンクだけで、ストリートビューは出ません。

### 通学区域

町名と通学区域は同じではなく、番地単位の区域データ（ポリゴン）は公開されていないため、**通学区域の地図表示・自動判定は実装していません**。ゲーム内では学習用である旨と、[鎌ケ谷市教育委員会の通学区域ページ](https://www.city.kamagaya.chiba.jp/kosodate-kyouiku/kyouiku/shou-chuugakou/h290601tsuugakukui.html)への案内を表示しています。

## キャラクター利用条件

「かまたん」は鎌ケ谷市のマスコットキャラクターで、Web 公開物でのデザイン使用には市の承認申請が必要です（`docs/kamatan-usage-notes.md`）。
承認を得るまで**公式画像は一切含めず**、案内役は汎用の方位磁針アイコンで表示しています。承認後は `src/config/character.ts` の `imageSrc` と `officialImageApproved` を更新すると差し替わります。

## プライバシー

- 氏名・住所・位置情報などの個人情報は収集しません。GPS・カメラ・マイク・センサーも使いません。
- ハイスコア・図鑑・設定・「わたしの学校」の選択は端末の localStorage（キー `kamagaya-adventure:save`、`version: 1`）にのみ保存され、外部送信しません。
- アクセス解析ツールは導入していません。設定画面からセーブデータを消去できます。
- ストリートビューの埋め込み（キー設定時のみ）は「ここで見る」をタップしたときだけ Google に接続し、Google の規約・プライバシーポリシーが適用されます。タップするまで Google との通信は発生せず、キー未設定のビルドでは Google マップのリンクだけで埋め込みはありません。

## 省電力設計

- 地図は SVG。描画はユーザー操作（タップ・ピンチ・ボタン）と状態変化のときだけ。静止中に動くものはありません。
- 常時再生アニメーションなし。正解時の紙吹雪は 24 個・約 2 秒で DOM から消え、出題区域の点滅は 3 回で止まります。`transform` / `opacity` 中心。
- 画面遷移アニメーションなし（即応性優先）。ボタンの押し込みは CSS のみ。
- Page Visibility API: タブ非表示中はチャレンジのタイマー（`setInterval`）を止め、非表示時間を計測から除外。復帰で再開。
- 設定の「省電力モード」: `<html class="power-save">` と Motion の `reducedMotion="always"` で装飾アニメーションを停止、紙吹雪を簡易表示に。`prefers-reduced-motion` も同じ扱い。
- 外部地図: Google マップは外部リンクのみ。埋め込み地図・画像・API スクリプトは読み込まないので、押さない限り通信も描画コストも発生しません。
- ストリートビューの埋め込み（キー設定時のみ）: 初期表示はボタンだけで iframe は置きません。「ここで見る」をタップしたときだけ iframe を作って Google に接続し、「とじる」で DOM から外します。省電力モードでも同じ動作です。キー未設定時は Google マップのリンクのみ。
- 通信: 地理データは 1 ファイル（gzip 約 44KB）を初回のみ取得。Web フォントは同梱せず端末の丸ゴシック（ヒラギノ丸ゴ / BIZ UDPゴシック / Noto Sans JP）を使用。音声ファイルなし（効果音は Web Audio で合成）。写真は 1 枚 80KB 以下の WebP で、表示するときだけ読み込む。

## パフォーマンス計測結果

`docs/performance.md` を参照（ビルドサイズ、Lighthouse、静止時の描画確認）。

## ディレクトリ

```
scripts/prepare-geo-data/  地理データ変換（build-geo.mjs）
data/source/               元データ（鎌ケ谷市分のみ抽出）
public/data/geo/           生成した地図 JSON
src/app/                   App（画面遷移）・AppContext・モード定義
src/components/map/        KamagayaMap（SVG 地図・ピン・ズーム）
src/components/game/       クイズ UI 部品
src/components/encyclopedia/ 図鑑の詳細
src/components/mascot/     案内役（Guide）
src/data/                  学校・図書館・児童センター・町名・称号・セリフ
src/lib/                   geo / quiz / engine / scoring / storage / timer / hints / audio
src/screens/               各画面
tests/unit, tests/e2e      Vitest / Playwright
```

## 今後の開発予定

- かまたん公式画像の使用承認申請と差し替え
- 通学区域の公式データが公開された場合の区域表示
- 主要駅・道路レイヤー
- 施設写真の撮影・収録（仕組みは実装済み。`docs/photos.md`）
- 効果音・演出のバリエーション追加、アクセシビリティの実機確認

## ライセンス

アプリ本体は MIT License。データ・フォント等の出典と条件は `NOTICE.md` を参照。
