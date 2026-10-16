import type { ModeId } from '../types'

export interface RankTitle {
  title: string
  kana?: string
  message: string
}

/** 10 問モードの称号（正解数） */
export function titleForCount(correct: number): RankTitle {
  if (correct >= 10) return { title: 'かまがやマスター！', message: 'ぜんぶ せいかい！ きみは かまがやの ことなら なんでも しってるたん！' }
  if (correct >= 7) return { title: 'かまがやものしり博士', kana: 'はかせ', message: 'すごい！ かまがやの ことを よく しってるたん！' }
  if (correct >= 4) return { title: 'かまがやたんけんか', message: 'いいちょうし！ もっと たんけん してみるたん！' }
  return { title: 'かまがやたんけんのたまご', message: 'これから いっぱい はっけん できるたん！' }
}

/** チャレンジモードの称号（スコア） */
export function titleForScore(score: number): RankTitle {
  if (score >= 2500) return { title: 'でんせつの かまがやマスター！', message: 'しんじられない はやさ！ きみは でんせつたん！' }
  if (score >= 1600) return { title: 'かまがやマスター！', message: 'はやくて せいかく！ マスターの しょうごうたん！' }
  if (score >= 1000) return { title: 'かまがやものしり博士', kana: 'はかせ', message: 'すごい！ かまがやの ことを よく しってるたん！' }
  if (score >= 500) return { title: 'かまがやたんけんか', message: 'いいちょうし！ つぎは もっと はやく こたえてみるたん！' }
  return { title: 'かまがやたんけんのたまご', message: 'まずは たんけんモードで まちを おぼえてみるたん！' }
}

export function titleFor(mode: ModeId, correct: number, score: number): RankTitle {
  return mode === 'challenge' ? titleForScore(score) : titleForCount(correct)
}
