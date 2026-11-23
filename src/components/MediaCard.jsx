import { memo } from 'react'
import { Heart, Film, Tv, MonitorPlay } from 'lucide-react'

const ICONS = { live: Tv, movie: Film, series: MonitorPlay }

function MediaCard({ item, fav, onOpen, onToggleFav }) {
  const Icon = ICONS[item.type] || Film
  return (
    <div className={`card card-${item.type}`}>
      <button className="card-poster" onClick={() => onOpen(item)} aria-label={`Abrir ${item.name}`}>
        <span className="card-fallback"><Icon size={26} /></span>
        {item.logo && <img src={item.logo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
          onError={event => { event.currentTarget.style.display = 'none' }} />}
        {item.type === 'live' && <span className="live-tag">AO VIVO</span>}
      </button>
      <div className="card-info">
        <div><b title={item.name}>{item.name}</b><small>{item.label}</small></div>
        <button className={`heart${fav ? ' on' : ''}`} onClick={() => onToggleFav(item)}
          aria-pressed={fav} aria-label={fav ? 'Tirar da minha lista' : 'Adicionar à minha lista'}>
          <Heart size={17} fill={fav ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  )
}
export default memo(MediaCard)
