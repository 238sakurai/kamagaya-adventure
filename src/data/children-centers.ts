import type { Facility } from '../types'

/**
 * 鎌ケ谷市の児童センター（6 施設）。
 * 出典: 鎌ケ谷市公式サイト 施設案内（児童センター） https://www.city.kamagaya.chiba.jp/sisetsu/jidoucenter/index.html
 *       および各施設ページ。豆知識は市の子育てサイト「かまっこ応援団」（鎌ケ谷市子育て支援センター運営）に基づく。
 * 座標: 国土地理院 地名検索 API（住所検索）。南・粟野は枝番まで一致しなかったため
 *       鎌ケ谷市 施設案内マップのデータ（市公式サイト）の座標を採用。
 * 確認日: 2026-10-16
 */
const BASE = 'https://www.city.kamagaya.chiba.jp/sisetsu/jidoucenter/'
const MUNICIPAL = `${BASE}index.html`
const VERIFIED = '2026-10-16'
const GSI = '国土地理院 地名検索 API（住所検索）'
const CITY_MAP = '鎌ケ谷市 施設案内マップ（市公式サイト）'
const COMMON = '子どもたちが遊びや体験をとおして元気に育つのを応援する場所。子育て中のおうちの人が相談したり、友だちをつくったりもできるよ。'

export const CHILDREN_CENTERS: Facility[] = [
  {
    id: 'center-tobu',
    name: '東部児童センター',
    kana: 'とうぶじどうセンター',
    category: 'children-center',
    address: '千葉県鎌ケ谷市東道野辺四丁目2番18号',
    latitude: 35.757313,
    longitude: 140.002045,
    town: '東道野辺',
    officialUrl: `${BASE}toubu-jidou.html`,
    municipalUrl: MUNICIPAL,
    description: `子育て支援センターもいっしょにある児童センター。${COMMON}`,
    trivia: 'ホールには小学生向けの大きな木の遊具、遊戯室の入口にはボルダリングがあるよ。',
    sourceUrl: `${BASE}toubu-jidou.html`,
    verifiedAt: VERIFIED,
    coordSource: GSI,
  },
  {
    id: 'center-chuo',
    name: '中央児童センター',
    kana: 'ちゅうおうじどうセンター',
    category: 'children-center',
    address: '千葉県鎌ケ谷市南初富3-19-31',
    latitude: 35.769119,
    longitude: 140.007599,
    town: '南初富',
    officialUrl: `${BASE}chuo-jidou.html`,
    municipalUrl: MUNICIPAL,
    description: COMMON,
    trivia: '「鎌ケ谷市の真ん中にある児童センター」と紹介されているよ。お庭に砂場・ブランコ・すべり台・鉄棒があるんだって。',
    sourceUrl: `${BASE}chuo-jidou.html`,
    verifiedAt: VERIFIED,
    coordSource: GSI,
  },
  {
    id: 'center-minami',
    name: '南児童センター',
    kana: 'みなみじどうセンター',
    category: 'children-center',
    address: '千葉県鎌ケ谷市道野辺1042-2',
    latitude: 35.747585,
    longitude: 139.98563,
    town: '道野辺',
    officialUrl: `${BASE}minami-jidou.html`,
    municipalUrl: MUNICIPAL,
    description: COMMON,
    trivia: '広いお庭があって、三輪車やかけっこ、砂場あそびができるよ。馬込沢駅から歩いて10分くらい。',
    sourceUrl: `${BASE}minami-jidou.html`,
    verifiedAt: VERIFIED,
    coordSource: CITY_MAP,
  },
  {
    id: 'center-kunugiyama',
    name: 'くぬぎ山児童センター',
    kana: 'くぬぎやまじどうセンター',
    category: 'children-center',
    address: '千葉県鎌ケ谷市くぬぎ山4-2-46-10（くぬぎ山コミュニティセンター併設）',
    latitude: 35.78149,
    longitude: 139.974716,
    town: 'くぬぎ山',
    officialUrl: `${BASE}kunugiyama-jidou.html`,
    municipalUrl: MUNICIPAL,
    description: `くぬぎ山コミュニティセンターにある児童センター。${COMMON}`,
    trivia: 'おなじ建物に図書館の西部分館も入っているよ。くぬぎ山駅から歩いて2分。',
    sourceUrl: `${BASE}kunugiyama-jidou.html`,
    verifiedAt: VERIFIED,
    coordSource: GSI,
  },
  {
    id: 'center-kitanakazawa',
    name: '北中沢児童センター',
    kana: 'きたなかざわじどうセンター',
    category: 'children-center',
    address: '千葉県鎌ケ谷市北中沢2-1-23（北中沢コミュニティセンター併設）',
    latitude: 35.772255,
    longitude: 139.988281,
    town: '北中沢',
    officialUrl: `${BASE}kitanakazawa-jidou.html`,
    municipalUrl: MUNICIPAL,
    description: `北中沢コミュニティセンターにある児童センター。${COMMON}`,
    trivia: 'こわれたおもちゃをなおしてくれる「おもちゃの病院」が開かれているよ。',
    sourceUrl: `${BASE}kitanakazawa-jidou.html`,
    verifiedAt: VERIFIED,
    coordSource: GSI,
  },
  {
    id: 'center-awano',
    name: '粟野児童センター',
    kana: 'あわのじどうセンター',
    category: 'children-center',
    address: '千葉県鎌ケ谷市粟野79-1（粟野コミュニティセンター併設）',
    latitude: 35.788075,
    longitude: 140.00471,
    town: '粟野',
    officialUrl: `${BASE}awano-jidou.html`,
    municipalUrl: MUNICIPAL,
    description: `粟野コミュニティセンターにある児童センター。${COMMON}`,
    trivia: '緑いっぱいの「粟野の森」のとなり。大きな遊具「きっころころがし」と木の砂場があるよ。',
    sourceUrl: `${BASE}awano-jidou.html`,
    verifiedAt: VERIFIED,
    coordSource: CITY_MAP,
  },
]
