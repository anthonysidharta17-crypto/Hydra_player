import MediaCard from './MediaCard'
import { useApp } from '../context/AppContext'
export default function Row({ title, hint, items, limit = 24 }) {
  const { openItem, toggleFavorite, favoriteIds } = useApp()
  if (!items.length) return null
  return <section className="row"><div className="row-head"><h3>{title}</h3>{hint && <small>{hint}</small>}</div>
    <div className="row-scroll">{items.slice(0, limit).map(item => <MediaCard key={item.id} item={item} fav={favoriteIds.has(item.id)} onOpen={openItem} onToggleFav={toggleFavorite} />)}</div>
  </section>
}
