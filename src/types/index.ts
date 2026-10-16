export type Point = [number, number]
/** 外周リング + 穴リング。各リングは閉じている（先頭と末尾が同じ点） */
export type PolygonRings = Point[][]
export type BBox = [number, number, number, number]

export type FacilityCategory = 'elementary' | 'junior-high' | 'library' | 'children-center'
/** 図鑑のカテゴリ（施設 4 種 + 町名） */
export type EntryCategory = FacilityCategory | 'district'

/**
 * 図鑑・クイズの解説に出す写真（実際に探検するときの目印）。
 * ファイルは public/images/entries/ に置き、scripts/optimize-photos.mjs で WebP（幅 640px 以下・80KB 以下）にする。
 * SVG のイラストでもよい。利用条件は docs/photos.md を参照。
 */
export interface EntryPhoto {
  /** BASE_URL からの相対パス（例: images/entries/library-main.webp） */
  src: string
  /** 画像の説明（スクリーンリーダー用。何が写っているかを短く） */
  alt: string
  /** 実寸（レイアウトのずれを防ぐため、<img> の width / height に使う） */
  width: number
  height: number
  /** 撮影者または提供元（画面に表示する） */
  credit: string
  /** 利用条件（例: 撮影者の許諾、CC BY 4.0）。画面に表示する */
  license: string
  /** 入手元 URL（他者の写真を使う場合） */
  sourceUrl?: string
  /** 撮影日（YYYY-MM-DD）。目印として古くなっていないかの目安 */
  takenAt?: string
}

export interface Facility {
  id: string
  name: string
  kana: string
  category: FacilityCategory
  address: string
  latitude: number
  longitude: number
  /** 施設・学校独自の公式サイト */
  officialUrl?: string
  /** 鎌ケ谷市公式サイトの施設紹介ページ */
  municipalUrl?: string
  /** 所在する町名（住所から。通学区域ではない） */
  town: string
  description?: string
  trivia?: string
  /** 目印になる写真（任意） */
  photo?: EntryPhoto
  sourceUrl: string
  verifiedAt: string
  /** 座標の出典 */
  coordSource: string
}

export interface District {
  id: string
  name: string
  kana: string
  /** 丁目がある町なら丁目数（表示用） */
  chomeCount: number
  /** 子ども向けの一言（位置のヒントにもなる） */
  hint?: string
  /** 目印になる写真（任意） */
  photo?: EntryPhoto
}

/** 地図データ（scripts/prepare-geo-data で生成） */
export interface ProjectionMeta {
  type: 'web-mercator'
  scale: number
  offsetLon: number
  offsetMercY: number
  padding: number
}

export interface GeoShape {
  polygons: PolygonRings[]
  centroid: Point
  bbox: BBox
}

export interface GeoDistrict extends GeoShape {
  id: string
  name: string
  /** 含まれる町丁（国勢調査 小地域）のコードと名前 */
  areas: { code: string; name: string }[]
}

export interface GeoArea extends GeoShape {
  code: string
  name: string
  districtId: string
}

export interface GeoData {
  version: number
  generatedAt: string
  sources: { name: string; provider: string; url: string; license: string; note: string }[]
  viewBox: BBox
  projection: ProjectionMeta
  city: GeoShape
  districts: GeoDistrict[]
  /** 町丁（丁目）単位の細い境界線。表示用 */
  areas: GeoArea[]
}

export type ModeId = 'school' | 'district' | 'facility' | 'challenge'
export type SchoolFilter = 'elementary' | 'junior-high' | 'all'

export type QuestionKind = 'pin' | 'choice'

export interface Question {
  kind: QuestionKind
  /** 施設 ID または町名 ID */
  targetId: string
  /** pin 問題: 地図に出すピンの候補 ID（正解を含む） */
  pinIds: string[]
  /** choice 問題: 4 択の選択肢 ID（正解を含む、表示順） */
  choices: string[]
}

export interface ModeConfig {
  id: ModeId
  label: string
  kana: string
  title: string
  description: string
  emoji: string
  /** null = 時間制限まで無制限 */
  questionCount: number | null
  /** 1 問あたりの回答回数 */
  attempts: number
  hintAvailable: boolean
  /** 秒。null = 制限なし */
  timeLimit: number | null
  /** 正解後に自動で次へ進むミリ秒。null = 手動 */
  autoAdvanceMs: number | null
}

export interface AnswerRecord {
  targetId: string
  correct: boolean
  attempts: number
  hintUsed: boolean
  points: number
}

export interface LastResult {
  correct: boolean
  targetId: string
  answeredId: string
  points: number
  exhausted: boolean
}

export type GamePhase = 'question' | 'feedback' | 'finished'

export interface GameState {
  mode: ModeId
  questions: Question[]
  index: number
  phase: GamePhase
  score: number
  combo: number
  maxCombo: number
  attemptsLeft: number
  hintUsed: boolean
  wrongIds: string[]
  removedChoices: string[]
  lastResult: LastResult | null
  records: AnswerRecord[]
}

export type GameAction =
  | { type: 'answer'; id: string }
  | { type: 'hint'; removed?: string[] }
  | { type: 'next' }
  | { type: 'timeUp' }

export interface GameSummary {
  mode: ModeId
  score: number
  correct: number
  answered: number
  maxCombo: number
  wrongIds: string[]
  correctIds: string[]
  title: string
  isNewRecord: boolean
}

export interface DiscoveryEntry {
  count: number
  firstAt: string
  lastAt: string
}

export interface PlayRecord {
  at: string
  mode: ModeId
  score: number
  correct: number
  answered: number
}

export interface Settings {
  sound: boolean
  powerSave: boolean
  /** 「わたしの学校」で選んだ小学校の ID。端末内にのみ保存 */
  mySchoolId: string | null
}

export interface SaveData {
  version: 1
  highScores: Record<ModeId, number>
  /** 発見済み（施設 ID・町名 ID） */
  discovered: Record<string, DiscoveryEntry>
  wrong: Record<string, number>
  history: PlayRecord[]
  lastPlayedAt: string | null
  settings: Settings
}
