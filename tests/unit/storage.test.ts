import { describe, expect, it } from 'vitest'
import { applyDiscovery, applySummary, clearSave, createDefaultSave, isDiscovered, loadSave, migrate, persistSave, STORAGE_KEY, updateSettings } from '../../src/lib/storage'

class MemoryStorage {
  map = new Map<string, string>()
  getItem(k: string) {
    return this.map.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
}

describe('storage', () => {
  it('壊れたデータは初期値になる', () => {
    expect(migrate(null)).toEqual(createDefaultSave())
    expect(migrate('x')).toEqual(createDefaultSave())
    expect(migrate({ version: 99, highScores: { school: 'a' } }).highScores.school).toBe(0)
  })

  it('保存と読み込み、設定の引き継ぎ', () => {
    const st = new MemoryStorage()
    let save = createDefaultSave()
    save = updateSettings(save, { powerSave: true, mySchoolId: 'es-tobu', sound: false })
    persistSave(st, save)
    const loaded = loadSave(st)
    expect(loaded.settings).toEqual({ sound: false, powerSave: true, mySchoolId: 'es-tobu' })
    expect(loaded.version).toBe(1)
    clearSave(st)
    expect(st.getItem(STORAGE_KEY)).toBeNull()
  })

  it('結果の反映: ハイスコア・発見・履歴', () => {
    const now = new Date('2026-10-16T00:00:00Z')
    let save = createDefaultSave()
    save = applySummary(save, { mode: 'school', score: 300, correct: 3, answered: 4, maxCombo: 3, correctIds: ['a', 'b'], wrongIds: ['c'], title: 't', isNewRecord: true }, now)
    expect(save.highScores.school).toBe(300)
    expect(isDiscovered(save, 'a')).toBe(true)
    expect(isDiscovered(save, 'c')).toBe(false)
    expect(save.wrong.c).toBe(1)
    expect(save.history).toHaveLength(1)
    save = applySummary(save, { mode: 'school', score: 100, correct: 1, answered: 1, maxCombo: 1, correctIds: ['a'], wrongIds: [], title: 't', isNewRecord: false }, now)
    expect(save.highScores.school).toBe(300)
    expect(save.discovered.a!.count).toBe(2)
  })

  it('探検での発見', () => {
    const save = applyDiscovery(createDefaultSave(), 'town-0300')
    expect(isDiscovered(save, 'town-0300')).toBe(true)
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save)
  })
})
