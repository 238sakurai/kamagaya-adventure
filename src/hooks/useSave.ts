import { useCallback, useEffect, useRef, useState } from 'react'
import { clearSave, createDefaultSave, loadSave, persistSave } from '../lib/storage'
import type { SaveData } from '../types'

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export interface SaveApi {
  save: SaveData
  updateSave: (updater: (prev: SaveData) => SaveData) => void
  resetSave: () => void
}

export function useSave(): SaveApi {
  const storageRef = useRef<Storage | null>(browserStorage())
  const [save, setSave] = useState<SaveData>(() => loadSave(browserStorage()))

  useEffect(() => {
    persistSave(storageRef.current, save)
  }, [save])

  const updateSave = useCallback((updater: (prev: SaveData) => SaveData) => setSave((prev) => updater(prev)), [])
  const resetSave = useCallback(() => {
    clearSave(storageRef.current)
    setSave(createDefaultSave())
  }, [])

  return { save, updateSave, resetSave }
}
