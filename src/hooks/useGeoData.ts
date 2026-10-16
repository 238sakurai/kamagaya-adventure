import { useEffect, useState } from 'react'
import type { GeoData } from '../types'

const GEO_URL = `${import.meta.env.BASE_URL}data/geo/kamagaya.json`

let cache: Promise<GeoData> | null = null

export function fetchGeoData(): Promise<GeoData> {
  cache ??= fetch(GEO_URL).then(async (res) => {
    if (!res.ok) throw new Error(`地図データの読み込みに失敗しました (${res.status})`)
    const data = (await res.json()) as GeoData
    if (!data.city || !Array.isArray(data.districts) || data.districts.length === 0) throw new Error('地図データが空です')
    return data
  })
  cache.catch(() => {
    cache = null
  })
  return cache
}

export function useGeoData(): { geo: GeoData | null; error: string | null } {
  const [geo, setGeo] = useState<GeoData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchGeoData()
      .then((data) => active && setGeo(data))
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : String(err)))
    return () => {
      active = false
    }
  }, [])

  return { geo, error }
}
