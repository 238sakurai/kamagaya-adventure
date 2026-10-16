# 地理データの元データ

ビルド時に `npm run data:geo`（`scripts/prepare-geo-data/build-geo.mjs`）が読み込み、
`public/data/geo/kamagaya.json` を生成します。いずれも鎌ケ谷市（市区町村コード 12224）の
地物だけを抽出したもので、ジオメトリは無加工です。

## n03-2024-kamagaya-city.geojson（市境）

- 出典: 国土数値情報 行政区域データ（N03）令和6年版（2024年1月1日時点） 国土交通省
- 取得元: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html
  （`N03-20240101_12_GML.zip` から `N03_007 == "12224"` の地物を抽出）
- ライセンス: CC BY 4.0（国土数値情報ダウンロードサイトの利用規約に従う）
- 備考: ポリゴン内の 2 つの穴は、鎌ケ谷市に囲まれた船橋市の飛地です。

## estat-2020-kamagaya-small-areas.geojson（町丁・字等の境界）

- 出典: 「令和2年国勢調査 小地域境界データ（町丁・字等）」 総務省統計局（政府統計の総合窓口 e-Stat）
- 取得元: https://www.e-stat.go.jp/gis/statmap-search?page=1&type=2&aggregateUnitForBoundary=A&toukeiCode=00200521&toukeiYear=2020&serveyId=A002005212020&prefCode=12&coordsys=1&format=shape&datum=2011
  （千葉県 鎌ケ谷市・世界測地系緯度経度・Shapefile を GeoJSON に変換）
- ライセンス: 政府標準利用規約（第2.0版）＝ CC BY 4.0 互換
- 備考: 92 ポリゴン・85 の KEY_CODE・31 の町（KIHON1 単位）。統計上の小地域であり、
  住居表示や通学区域の境界と同一ではありません。
