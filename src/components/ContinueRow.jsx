import { useMemo, useState } from 'react'
import MediaCard from './MediaCard'
import { useApp } from '../context/AppContext'
import { loadHistory, removeProgress } from '../core/history'
import { removeLastEpisode } from '../core/playerPrefs'
// "Continuar assistindo": toca direto e o player retoma de onde parou.
export default function ContinueRow() {
  const { getItem, play, favoriteIds, toggleFavorite } = useApp()
  const [tick, setTick] = useState(0)
  const list = useMemo(() => loadHistory()
    .filter(h => h.t > 10)
    .map(h => ({ ...h, item: getItem(h.id) }))
    .filter(h => h.item && h.item.type !== 'live' && (h.item.type === 'series' || !h.d || h.t / h.d < 0.95)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [getItem, tick])
  if (!list.length) return null
  const remove = h => { removeProgress(h.id); if (h.item.type === 'series') removeLastEpisode(h.item.sid); setTick(n => n + 1) }
  return <section className="row"><div className="row-head"><h3>Continuar assistindo</h3><small>de onde você parou</small></div>
    <div className="row-scroll">{list.slice(0, 24).map(h => <MediaCard key={h.id} item={h.item} fav={favoriteIds.has(h.item.id)} onOpen={it => play(it)} onToggleFav={toggleFavorite}
      progress={h.d > 0 ? Math.round(h.t / h.d * 100) : 0} onRemove={() => remove(h)} />)}</div>
  </section>
}
