/**
 * 効果音は Web Audio API で合成する（音声ファイル不要・著作権フリー）。
 * AudioContext はブラウザの自動再生制限のため、最初のユーザー操作時に生成する。
 */
export type SoundName = 'tap' | 'correct' | 'wrong' | 'combo' | 'result' | 'tick' | 'discover'

interface Note {
  freq: number
  at: number
  dur: number
  type?: OscillatorType
  gain?: number
}

const MASTER_GAIN = 0.16

const SEQUENCES: Record<SoundName, Note[]> = {
  tap: [{ freq: 880, at: 0, dur: 0.06, type: 'triangle' }],
  correct: [
    { freq: 659.25, at: 0, dur: 0.1 },
    { freq: 783.99, at: 0.1, dur: 0.1 },
    { freq: 1046.5, at: 0.2, dur: 0.22 },
  ],
  wrong: [
    { freq: 330, at: 0, dur: 0.12, type: 'triangle' },
    { freq: 262, at: 0.14, dur: 0.2, type: 'triangle' },
  ],
  combo: [
    { freq: 784, at: 0, dur: 0.07 },
    { freq: 988, at: 0.07, dur: 0.07 },
    { freq: 1175, at: 0.14, dur: 0.07 },
    { freq: 1568, at: 0.21, dur: 0.18 },
  ],
  result: [
    { freq: 523.25, at: 0, dur: 0.12 },
    { freq: 659.25, at: 0.12, dur: 0.12 },
    { freq: 783.99, at: 0.24, dur: 0.12 },
    { freq: 1046.5, at: 0.36, dur: 0.35 },
  ],
  tick: [{ freq: 1200, at: 0, dur: 0.04, type: 'square', gain: 0.4 }],
  discover: [
    { freq: 1046.5, at: 0, dur: 0.08, type: 'triangle' },
    { freq: 1318.5, at: 0.08, dur: 0.08, type: 'triangle' },
    { freq: 1568, at: 0.16, dur: 0.08, type: 'triangle' },
    { freq: 2093, at: 0.24, dur: 0.25, type: 'triangle' },
  ],
}

export class SoundPlayer {
  private ctx: AudioContext | null = null
  enabled = true

  /** ユーザー操作のハンドラ内から呼ぶこと */
  unlock(): void {
    if (typeof window === 'undefined') return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    this.ctx ??= new Ctor()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  play(name: SoundName): void {
    if (!this.enabled) return
    this.unlock()
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running') return
    const now = ctx.currentTime
    for (const note of SEQUENCES[name]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = note.type ?? 'sine'
      osc.frequency.value = note.freq
      const peak = MASTER_GAIN * (note.gain ?? 1)
      gain.gain.setValueAtTime(0.0001, now + note.at)
      gain.gain.exponentialRampToValueAtTime(peak, now + note.at + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + note.at)
      osc.stop(now + note.at + note.dur + 0.02)
    }
  }
}

export const soundPlayer = new SoundPlayer()
