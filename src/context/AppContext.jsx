import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadCatalog } from '../core/catalog'
import { loadFavorites, saveFavorites, snapshot } from '../core/favorites'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const TYPES = ['live', 'movie', 'series']
const ROUTE_OF = { movie: 'filmes', series: 'series' }
const EMPTY_VIEW = { tab: 'all', group: null }

// Estado compartilhado: catálogo, favoritos, aviso rápido e abertura de itens.
export function AppProvider({ creds, navigate, children }) {
  const [catalog, setCatalog] = useState({ live: null, movie: null, series: null })
  const [status, setStatus] = useState({ live: 'loading', movie: 'loading', series: 'loading' })
  const [errors, setErrors] = useState({})
  const [favorites, setFavorites] = useState(loadFavorites)
  const [views, setViews] = useState({ live: EMPTY_VIEW, movie: EMPTY_VIEW, series: EMPTY_VIEW })
  const [toast, setToast] = useState('')
  const toastTimer = useRef(0)

  const load = useCallback(async type => {
    setStatus(s => ({ ...s, [type]: 'loading' }))
    try {
      const data = await loadCatalog(creds, type)
      setCatalog(c => ({ ...c, [type]: data }))
      setStatus(s => ({ ...s, [type]: 'ready' }))
    } catch (err) {
      setErrors(e => ({ ...e, [type]: err.message }))
      setStatus(s => ({ ...s, [type]: 'error' }))
    }
  }, [creds])

  useEffect(() => { TYPES.forEach(load) }, [load])

  const showToast = useCallback(message => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }, [])

  const favoriteIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites])
  const toggleFavorite = useCallback(item => {
    setFavorites(list => {
      const next = list.some(f => f.id === item.id) ? list.filter(f => f.id !== item.id) : [snapshot(item), ...list]
      saveFavorites(next)
      return next
    })
  }, [])

  const getItem = useCallback(id => {
    const type = String(id).split('-')[0]
    return catalog[type]?.byId.get(id) || favorites.find(f => f.id === id) || null
  }, [catalog, favorites])

  // O player chega na etapa 3; por enquanto só avisa.
  const play = useCallback(() => showToast('O player chega na etapa 3.'), [showToast])

  const openItem = useCallback(item => {
    if (item.type === 'live') return play(item)
    navigate(ROUTE_OF[item.type], item.id)
  }, [navigate, play])

  const setView = useCallback((type, patch) => setViews(v => ({ ...v, [type]: { ...v[type], ...patch } })), [])

  const value = useMemo(() => ({
    creds, catalog, status, errors, reload: load, favorites, favoriteIds, toggleFavorite,
    getItem, openItem, play, navigate, views, setView, showToast
  }), [creds, catalog, status, errors, load, favorites, favoriteIds, toggleFavorite, getItem, openItem, play, navigate, views, setView, showToast])

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && <div className="toast" role="status">{toast}</div>}
    </Ctx.Provider>
  )
}
