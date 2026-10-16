import type { DiscoveryEntry, GameSummary, ModeId, SaveData, Settings } from '../types'

export const STORAGE_KEY = 'kamagaya-adventure:save'
export const SAVE_VERSION = 1 as const
const HISTORY_LIMIT = 50
const MODE_IDS: ModeId[] = ['school', 'district', 'facility', 'challenge']

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    highScores: { school: 0, district: 0, facility: 0, challenge: 0 },
    discovered: {},
    wrong: {},
    history: [],
    lastPlayedAt: null,
    settings: { sound: true, powerSave: false, mySchoolId: null },
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0)
const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback)

/** 保存データを現在のバージョンに変換する。壊れていれば初期値。未知のキーは捨てる */
export function migrate(raw: unknown): SaveData {
  const base = createDefaultSave()
  if (!isRecord(raw)) return base
  const highScores = isRecord(raw.highScores) ? raw.highScores : {}
  const settings = isRecord(raw.settings) ? raw.settings : {}
  const discovered: SaveData['discovered'] = {}
  if (isRecord(raw.discovered)) {
    for (const [id, entry] of Object.entries(raw.discovered)) {
      if (!isRecord(entry)) continue
      discovered[id] = {
        count: Math.max(1, num(entry.count)),
        firstAt: str(entry.firstAt, new Date(0).toISOString()),
        lastAt: str(entry.lastAt, new Date(0).toISOString()),
      }
    }
  }
  const wrong: SaveData['wrong'] = {}
  if (isRecord(raw.wrong)) for (const [id, n] of Object.entries(raw.wrong)) wrong[id] = num(n)
  const history = Array.isArray(raw.history)
    ? raw.history
        .filter(isRecord)
        .filter((h) => typeof h.at === 'string' && MODE_IDS.includes(h.mode as ModeId))
        .slice(-HISTORY_LIMIT)
        .map((h) => ({ at: h.at as string, mode: h.mode as ModeId, score: num(h.score), correct: num(h.correct), answered: num(h.answered) }))
    : []
  const scores = { ...base.highScores }
  for (const m of MODE_IDS) scores[m] = num(highScores[m])
  return {
    version: SAVE_VERSION,
    highScores: scores,
    discovered,
    wrong,
    history,
    lastPlayedAt: typeof raw.lastPlayedAt === 'string' ? raw.lastPlayedAt : null,
    settings: {
      sound: typeof settings.sound === 'boolean' ? settings.sound : base.settings.sound,
      powerSave: typeof settings.powerSave === 'boolean' ? settings.powerSave : base.settings.powerSave,
      mySchoolId: typeof settings.mySchoolId === 'string' ? settings.mySchoolId : null,
    },
  }
}

export function loadSave(storage: StorageLike | null): SaveData {
  if (!storage) return createDefaultSave()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultSave()
    return migrate(JSON.parse(raw))
  } catch {
    return createDefaultSave()
  }
}

export function persistSave(storage: StorageLike | null, save: SaveData): void {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(save))
  } catch {
    // プライベートモードなどで保存できない場合は無視する
  }
}

export function clearSave(storage: StorageLike | null): void {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function discover(discovered: Record<string, DiscoveryEntry>, id: string, at: string): Record<string, DiscoveryEntry> {
  const prev = discovered[id]
  return { ...discovered, [id]: prev ? { ...prev, count: prev.count + 1, lastAt: at } : { count: 1, firstAt: at, lastAt: at } }
}

/** ゲーム結果を保存データに反映する（純粋関数） */
export function applySummary(save: SaveData, summary: GameSummary, now: Date = new Date()): SaveData {
  const at = now.toISOString()
  let discovered = save.discovered
  for (const id of summary.correctIds) discovered = discover(discovered, id, at)
  const wrong = { ...save.wrong }
  for (const id of summary.wrongIds) wrong[id] = (wrong[id] ?? 0) + 1
  return {
    ...save,
    highScores: { ...save.highScores, [summary.mode]: Math.max(save.highScores[summary.mode], summary.score) },
    discovered,
    wrong,
    history: [...save.history, { at, mode: summary.mode, score: summary.score, correct: summary.correct, answered: summary.answered }].slice(-HISTORY_LIMIT),
    lastPlayedAt: at,
  }
}

/** 探検モードなどで 1 件発見したときの反映。すでに発見済みなら回数だけ増える */
export function applyDiscovery(save: SaveData, id: string, now: Date = new Date()): SaveData {
  return { ...save, discovered: discover(save.discovered, id, now.toISOString()), lastPlayedAt: now.toISOString() }
}

export function isDiscovered(save: SaveData, id: string): boolean {
  return id in save.discovered
}

export function updateSettings(save: SaveData, patch: Partial<Settings>): SaveData {
  return { ...save, settings: { ...save.settings, ...patch } }
}
