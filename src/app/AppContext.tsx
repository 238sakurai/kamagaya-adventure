import { MotionConfig, useReducedMotion } from 'motion/react'
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useGeoData } from '../hooks/useGeoData'
import { useSave } from '../hooks/useSave'
import { soundPlayer, type SoundName } from '../lib/audio'
import { updateSettings } from '../lib/storage'
import type { GeoData, SaveData, Settings } from '../types'

export interface AppContextValue {
  geo: GeoData | null
  geoError: string | null
  save: SaveData
  updateSave: (updater: (prev: SaveData) => SaveData) => void
  resetSave: () => void
  setSettings: (patch: Partial<Settings>) => void
  play: (name: SoundName) => void
  /** OS の「動きを減らす」設定 */
  reducedMotion: boolean
  /** 省電力モード（設定）。装飾アニメーションを止める */
  powerSave: boolean
  /** 装飾演出（紙吹雪・ゆれ）を出してよいか */
  effects: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { geo, error } = useGeoData()
  const { save, updateSave, resetSave } = useSave()
  const reducedMotion = useReducedMotion() ?? false
  const { sound, powerSave } = save.settings

  useEffect(() => {
    soundPlayer.enabled = sound
  }, [sound])

  useEffect(() => {
    document.documentElement.classList.toggle('power-save', powerSave)
  }, [powerSave])

  const setSettings = useCallback(
    (patch: Partial<Settings>) => {
      updateSave((prev) => updateSettings(prev, patch))
      if (patch.sound) soundPlayer.unlock()
    },
    [updateSave],
  )

  const play = useCallback((name: SoundName) => soundPlayer.play(name), [])

  const value = useMemo<AppContextValue>(
    () => ({ geo, geoError: error, save, updateSave, resetSave, setSettings, play, reducedMotion, powerSave, effects: !reducedMotion && !powerSave }),
    [geo, error, save, updateSave, resetSave, setSettings, play, reducedMotion, powerSave],
  )

  return (
    <AppContext.Provider value={value}>
      {/* 省電力モードでは motion のアニメーションをまとめて止める */}
      <MotionConfig reducedMotion={powerSave || reducedMotion ? 'always' : 'user'}>{children}</MotionConfig>
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
