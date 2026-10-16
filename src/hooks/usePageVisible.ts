import { useEffect, useState } from 'react'

/** タブが表示されているか（Page Visibility API）。非表示中はタイマーや演出を止める */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => (typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'))
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return visible
}
