import type { Facility } from '../types'

/**
 * 鎌ケ谷市立図書館（本館 + 分館 5）。
 * 出典: 鎌ケ谷市立図書館 施設案内 https://www.library-kamagaya-chiba.jp/toshow/html/access.html 、
 *       鎌ケ谷市立図書館設置条例施行規則、鎌ケ谷市公式サイト 施設案内（図書館）
 * 座標: 国土地理院 地名検索 API（住所を検索）。北部分館は番地まで一致しなかったため
 *       鎌ケ谷市 施設案内マップのデータ（市公式サイト）の座標を採用。
 * ふりがな: 公式のふりがな表記は確認できなかったため一般的な読み。
 * 確認日: 2026-10-16
 */
const ACCESS = 'https://www.library-kamagaya-chiba.jp/toshow/html/access.html'
const MUNICIPAL = 'https://www.city.kamagaya.chiba.jp/sisetsu/library/index.html'
const VERIFIED = '2026-10-16'
const GSI = '国土地理院 地名検索 API（住所検索）'
const CITY_MAP = '鎌ケ谷市 施設案内マップ（市公式サイト）'

export const LIBRARIES: Facility[] = [
  {
    id: 'library-main',
    name: '図書館本館',
    kana: 'としょかんほんかん',
    category: 'library',
    address: '千葉県鎌ケ谷市中央一丁目8番35号',
    latitude: 35.772675,
    longitude: 139.999695,
    town: '中央',
    officialUrl: `${ACCESS}#honkan`,
    municipalUrl: MUNICIPAL,
    description: '鎌ケ谷市立図書館のいちばん大きな図書館。初富駅から歩いて5分くらいのところにあるよ。',
    trivia: '2026年1月にリニューアルオープンしたよ。照明がぜんぶLEDになって、中高生向けのコーナーもできたんだって。',
    sourceUrl: ACCESS,
    verifiedAt: VERIFIED,
    coordSource: GSI,
  },
  {
    id: 'library-tobu',
    name: '東部分館',
    kana: 'とうぶぶんかん',
    category: 'library',
    address: '千葉県鎌ケ谷市東道野辺四丁目9番50号（東部学習センター内）',
    latitude: 35.753223,
    longitude: 140.003937,
    town: '東道野辺',
    officialUrl: `${ACCESS}#toubu`,
    municipalUrl: MUNICIPAL,
    description: '東部学習センターの中にある図書館。分館の中では、ここだけ夜8時まで開いているよ。',
    sourceUrl: ACCESS,
    verifiedAt: VERIFIED,
    coordSource: GSI,
  },
  {
    id: 'library-hokubu',
    name: '北部分館',
    kana: 'ほくぶぶんかん',
    category: 'library',
    address: '千葉県鎌ケ谷市佐津間631番地（北部公民館内）',
    latitude: 35.794809,
    longitude: 140.004986,
    town: '佐津間',
    officialUrl: `${ACCESS}#hokubu`,
    municipalUrl: MUNICIPAL,
    description: '北部公民館の中にある図書館。市のいちばん北のほうにあるよ。',
    sourceUrl: ACCESS,
    verifiedAt: VERIFIED,
    coordSource: CITY_MAP,
  },
  {
    id: 'library-seibu',
    name: '西部分館',
    kana: 'せいぶぶんかん',
    category: 'library',
    address: '千葉県鎌ケ谷市くぬぎ山四丁目2番46-10号（くぬぎ山コミュニティセンター内）',
    latitude: 35.78149,
    longitude: 139.974716,
    town: 'くぬぎ山',
    officialUrl: `${ACCESS}#seibu`,
    municipalUrl: MUNICIPAL,
    description: 'くぬぎ山コミュニティセンターの中にある図書館。おなじ建物に、くぬぎ山児童センターもあるよ。',
    sourceUrl: ACCESS,
    verifiedAt: VERIFIED,
    coordSource: GSI,
  },
  {
    id: 'library-nanbu',
    name: '南部分館',
    kana: 'なんぶぶんかん',
    category: 'library',
    address: '千葉県鎌ケ谷市道野辺61番地（南部公民館内）',
    latitude: 35.75716,
    longitude: 139.990738,
    town: '道野辺',
    officialUrl: `${ACCESS}#nanbu`,
    municipalUrl: MUNICIPAL,
    description: '南部公民館の中にある図書館。',
    sourceUrl: ACCESS,
    verifiedAt: VERIFIED,
    coordSource: GSI,
  },
  {
    id: 'library-higashihatsutomi',
    name: '東初富分館',
    kana: 'ひがしはつとみぶんかん',
    category: 'library',
    address: '千葉県鎌ケ谷市東初富一丁目10番1号（東初富公民館内）',
    latitude: 35.775932,
    longitude: 140.014938,
    town: '東初富',
    officialUrl: `${ACCESS}#hatutomi`,
    municipalUrl: MUNICIPAL,
    description: '東初富公民館の中にある図書館。',
    sourceUrl: ACCESS,
    verifiedAt: VERIFIED,
    coordSource: GSI,
  },
]
