/** 案内役のセリフ。短く、小学校低学年でも読めるように */
export const LINES = {
  title: ['今日はどこを探検するたん？', 'きみは鎌ケ谷市のこと、どれくらい知ってるたん？'],
  correct: ['すごい！だいせいかいたん！', 'やったね！せいかいたん！', 'そのとおりたん！'],
  combo: ['れんぞくせいかい！ノッてるたん！', 'とまらないたん！'],
  wrong: ['おしい！もういちど探してみるたん！', 'おしい！つぎは きっと わかるたん！'],
  hint: ['ヒントを みてみるたん？'],
  discover: ['あたらしい はっけんたん！', 'かまがや博士に一歩近づいたたん！'],
  complete: ['ずかんが いっぱいに なったたん！ おめでとうたん！'],
  timeUp: ['タイムアップたん！ よく がんばったたん！'],
} as const

export function pickLine(lines: readonly string[], seed = Math.random()): string {
  return lines[Math.floor(seed * lines.length) % lines.length]!
}
