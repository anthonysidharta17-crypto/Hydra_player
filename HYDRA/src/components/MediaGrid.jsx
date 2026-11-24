import { useEffect, useRef, useState } from 'react'
import MediaCard from './MediaCard'
import { useApp } from '../context/AppContext'
const BATCH = 180
export default function MediaGrid({ items, variant, empty = 'Nada por aqui ainda.' }) {
  const { openItem, toggleFavorite, favoriteIds } = useApp()
  const [count, setCount] = useState(BATCH), sentinel = useRef(null)
  useEffect(() => { setCount(BATCH) }, [items])
  useEffect(() => {
    const el = sentinel.current
    if (!el || count >= items.length) return undefined
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) setCount(c => Math.min(c + BATCH, items.length)) }, { rootMargin: '700px' })
    observer.observe(el); return () => observer.disconnect()
  }, [count, items.length])
  if (!items.length) return <p className="empty-note">{empty}</p>
  const kind = variant || items[0].type
  return <><div className={`grid grid-${kind}`}>
    {items.slice(0, count).map(item => <MediaCard key={item.id} item={item} fav={favoriteIds.has(item.id)} onOpen={openItem} onToggleFav={toggleFavorite} />)}
  </div>{count < items.length && <div ref={sentinel} className="more"><button className="btn-outline" onClick={() => setCount(c => Math.min(c + BATCH, items.length))}>Carregar mais ({items.length - count})</button></div>}</>
}
