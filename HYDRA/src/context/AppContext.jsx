import { Component, Suspense, createContext, lazy, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadCatalog } from '../core/catalog'
import { loadFavorites, saveFavorites, snapshot } from '../core/favorites'
const Player = lazy(() => import('../player/Player'))
const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
const TYPES = ['live', 'movie', 'series']
const ROUTE_OF = { movie: 'filmes', series: 'series' }
const EMPTY_VIEW = { tab: 'all', group: null }
class PlayerBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFail() }
  render() { return this.state.failed ? null : this.props.children }
}
const bootStyle = { position: 'fixed', inset: 0, zIndex: 1000, background: '#000', color: '#fff', display: 'grid', placeItems: 'center' }
export function AppProvider({ creds, navigate, children }) {
  const [catalog, setCatalog] = useState({ live: null, movie: null, series: null })
  const [status, setStatus] = useState({ live: 'loading', movie: 'loading', series: 'loading' })
  const [errors, setErrors] = useState({})
  const [favorites, setFavorites] = useState(loadFavorites)
  const [views, setViews] = useState({ live: EMPTY_VIEW, movie: EMPTY_VIEW, series: EMPTY_VIEW })
  const [toast, setToast] = useState('')
  const [player, setPlayer] = useState(null)
  const toastTimer = useRef(0)
  const load = useCallback(async type => {
    setStatus(s => ({ ...s, [type]: 'loading' }))
    setErrors(e => ({ ...e, [type]: '' }))
    try {
      const data = await loadCatalog(creds, type)
      setCatalog(c => ({ ...c, [type]: data }))
      setStatus(s => ({ ...s, [type]: 'ready' }))
    } catch (err) {
      setErrors(e => ({ ...e, [type]: err.message || 'Falha ao carregar.' }))
      setStatus(s => ({ ...s, [type]: 'error' }))
    }
  }, [creds])
  useEffect(() => { TYPES.forEach(load) }, [load])
  const reloadAll = useCallback(() => TYPES.forEach(load), [load])
  const showToast = useCallback(message => {
    setToast(message); clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])
  const favoriteIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites])
  const toggleFavorite = useCallback(item => setFavorites(list => {
    const next = list.some(f => f.id === item.id) ? list.filter(f => f.id !== item.id) : [snapshot(item), ...list]
    saveFavorites(next); return next
  }), [])
  const getItem = useCallback(id => {
    const type = String(id).split('-')[0]
    return catalog[type]?.byId.get(id) || favorites.find(f => f.id === id) || null
  }, [catalog, favorites])
  const play = useCallback((item, opts = {}) => {
    if (!item) return
    const episodeId = opts && typeof opts === 'object' ? (opts.episodeId ?? opts.sid ?? opts.id ?? null) : null
    const fromStart = !!(opts && typeof opts === 'object' && opts.fromStart)
    const streamUrl = opts && typeof opts === 'object' ? (opts.streamUrl || null) : null
    setPlayer({ item, episodeId, streamUrl, fromStart, key: Date.now() })
  }, [])
  const closePlayer = useCallback(() => setPlayer(null), [])
  const failPlayer = useCallback(() => { setPlayer(null); showToast('Não foi possível abrir o player. Tente novamente.') }, [showToast])
  const openItem = useCallback(item => { if (item.type === 'live') return play(item); navigate(ROUTE_OF[item.type], item.id) }, [navigate, play])
  const setView = useCallback((type, patch) => setViews(v => ({ ...v, [type]: { ...v[type], ...patch } })), [])
  const value = useMemo(() => ({ creds, catalog, status, errors, reload: load, reloadAll, favorites, favoriteIds, toggleFavorite, getItem, openItem, play, closePlayer, navigate, views, setView, showToast }),
    [creds, catalog, status, errors, load, reloadAll, favorites, favoriteIds, toggleFavorite, getItem, openItem, play, closePlayer, navigate, views, setView, showToast])
  return <Ctx.Provider value={value}>
    {children}
    {player && <PlayerBoundary key={player.key} onFail={failPlayer}><Suspense fallback={<div style={bootStyle}>Carregando player…</div>}>
      <Player request={player} creds={creds} onClose={closePlayer} showToast={showToast} />
    </Suspense></PlayerBoundary>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </Ctx.Provider>
}
