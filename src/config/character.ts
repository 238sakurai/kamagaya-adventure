/**
 * 案内役キャラクターの設定。
 *
 * 鎌ケ谷市の公式マスコット「かまたん」の画像を使うには、市の定める使用申請と承認が必要です。
 *   - 利用案内: https://www.city.kamagaya.chiba.jp/kamatan/request/index.html
 *   - 申請方法: https://www.city.kamagaya.chiba.jp/kamatan/request/request03.html
 * 承認が得られるまでは imageSrc を null のままにし、汎用の案内アイコンを表示します。
 * 承認後は public/images/ に承認済み画像を置き、imageSrc にそのパスを設定してください
 * （画像の加工は行わないこと）。
 */
export const CHARACTER = {
  /** 画面に表示する案内役の名前 */
  name: 'かまたん',
  /** 承認済みの公式画像のパス（BASE_URL からの相対）。未承認のため null */
  imageSrc: null as string | null,
  /** 公式画像の使用承認を得ているか。true にするのは承認通知を受け取ったあと */
  officialImageApproved: false,
} as const
