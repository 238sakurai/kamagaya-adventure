import type { District } from '../types'

/**
 * 鎌ケ谷市の町名（31 町）。
 * - 名前・読み: 日本郵便 郵便番号検索（千葉県鎌ケ谷市 31 町域）
 *   https://www.post.japanpost.jp/cgi-zip/zipcode.php?pref=12&city=1122240
 * - 町名一覧の裏付け: 鎌ケ谷市 町丁字別人口・世帯数（令和8年1月1日現在）、
 *   鎌ケ谷市 住居表示実施地区一覧（R08.03）
 *   https://www.city.kamagaya.chiba.jp/kurashi-tetsuzuki/todokede/shinchikutodoke.files/juukyohyouji_jisshiR08.03.pdf
 * - 地図上の区域: 令和2年国勢調査 小地域境界（public/data/geo/kamagaya.json）。ID は小地域の町丁コード（KIHON1）に対応
 * - 「旧大字」の豆知識は住居表示実施地区一覧の「旧町名」欄に基づく
 * 確認日: 2026-10-16
 */
export const DISTRICT_SOURCE = {
  verifiedAt: '2026-10-16',
  sources: [
    { title: '日本郵便 郵便番号検索（鎌ケ谷市）', url: 'https://www.post.japanpost.jp/cgi-zip/zipcode.php?pref=12&city=1122240' },
    { title: '鎌ケ谷市 住居表示実施地区一覧', url: 'https://www.city.kamagaya.chiba.jp/kurashi-tetsuzuki/todokede/shinchikutodoke.html' },
  ],
}

const d = (id: string, name: string, kana: string, chomeCount: number, hint?: string): District => ({ id, name, kana, chomeCount, hint })

export const DISTRICTS: District[] = [
  d('town-0010', '丸山', 'まるやま', 3, 'むかしは「鎌ケ谷」の一部だったよ'),
  d('town-0020', '鎌ケ谷', 'かまがや', 9, '市の名前と同じ町。一丁目から九丁目まであるよ'),
  d('town-0030', '東鎌ケ谷', 'ひがしかまがや', 3, 'むかしは「鎌ケ谷」の一部だったよ'),
  d('town-0040', '南鎌ケ谷', 'みなみかまがや', 4, 'むかしは「鎌ケ谷」の一部だったよ'),
  d('town-0050', '道野辺', 'みちのべ', 0, '丁目のない町。番地で住所をあらわすよ'),
  d('town-0060', '東道野辺', 'ひがしみちのべ', 7, 'むかしは「道野辺」の一部だったよ'),
  d('town-0070', '西道野辺', 'にしみちのべ', 0, 'むかしは「道野辺」の一部だったよ'),
  d('town-0080', '馬込沢', 'まごめざわ', 0, 'むかしは「道野辺」の一部だったよ'),
  d('town-0091', '中沢新町', 'なかざわしんまち', 0, 'むかしは「中沢」の一部だったよ'),
  d('town-0092', '中沢', 'なかざわ', 0, '丁目のない町。番地で住所をあらわすよ'),
  d('town-0100', '東中沢', 'ひがしなかざわ', 4, 'むかしは「中沢」の一部だったよ'),
  d('town-0110', '北中沢', 'きたなかざわ', 3, 'むかしは「中沢」の一部だったよ'),
  d('town-0120', '初富', 'はつとみ', 0, '丁目のない町。番地で住所をあらわすよ'),
  d('town-0130', '南初富', 'みなみはつとみ', 6, 'むかしは「初富」の一部だったよ'),
  d('town-0140', '右京塚', 'うきょうづか', 0, 'むかしは「初富」の一部だったよ'),
  d('town-0150', '中央', 'ちゅうおう', 2, 'むかしは「初富」の一部だったよ'),
  d('town-0160', '富岡', 'とみおか', 3, 'むかしは「初富」の一部だったよ'),
  d('town-0170', '東初富', 'ひがしはつとみ', 6, 'むかしは「初富」の一部だったよ'),
  d('town-0180', 'くぬぎ山', 'くぬぎやま', 5, 'ひらがなが入った町の名前。むかしは「初富」の一部だったよ'),
  d('town-0190', '串崎新田', 'くしざきしんでん', 0, '丁目のない町。番地で住所をあらわすよ'),
  d('town-0200', '粟野', 'あわの', 0, '丁目のない町。番地で住所をあらわすよ'),
  d('town-0210', '佐津間', 'さつま', 0, '丁目のない町。番地で住所をあらわすよ'),
  d('town-0220', '中佐津間', 'なかさつま', 2, 'むかしは「佐津間」の一部だったよ'),
  d('town-0230', '西佐津間', 'にしさつま', 2, 'むかしは「佐津間」の一部だったよ'),
  d('town-0240', '南佐津間', 'みなみさつま', 0, 'むかしは「佐津間」の一部だったよ'),
  d('town-0250', '軽井沢', 'かるいざわ', 0, '丁目のない町。番地で住所をあらわすよ'),
  d('town-0260', '道野辺中央', 'みちのべちゅうおう', 5, 'むかしは「道野辺」の一部だったよ'),
  d('town-0270', '初富本町', 'はつとみほんちょう', 2, 'むかしは「初富」の一部だったよ'),
  d('town-0280', '北初富', 'きたはつとみ', 0, 'むかしは「初富」の一部だったよ'),
  d('town-0290', '道野辺本町', 'みちのべほんちょう', 2, 'むかしは「道野辺」の一部だったよ'),
  d('town-0300', '新鎌ケ谷', 'しんかまがや', 4, 'むかしは「初富」の一部だったよ'),
]

export const DISTRICT_BY_ID: ReadonlyMap<string, District> = new Map(DISTRICTS.map((x) => [x.id, x]))

export function getDistrict(id: string): District {
  const x = DISTRICT_BY_ID.get(id)
  if (!x) throw new Error(`unknown district: ${id}`)
  return x
}
