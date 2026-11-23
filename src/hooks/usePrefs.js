import { useCallback, useEffect, useState } from 'react'
import { loadPrefs, savePrefs } from '../core/storage'

export function usePrefs() {
  const [prefs, setPrefs] = useState(loadPrefs)

  const updatePrefs = useCallback(patch => {
    setPrefs(current => {
      const next = { ...current, ...patch }
      savePrefs(next)
      return next
    })
  }, [])

  // O modo fácil aumenta textos e botões em todo o app.
  useEffect(() => { document.documentElement.dataset.mode = prefs.mode }, [prefs.mode])

  return { prefs, updatePrefs }
}
