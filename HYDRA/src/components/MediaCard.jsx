import { memo } from 'react'
import { Heart, Film, Tv, MonitorPlay, X } from 'lucide-react'
const ICONS = { live: Tv, movie: Film, series: MonitorPlay }
function MediaCard({ item, fav, onOpen, onToggleFav, progress, watched, onRemove }) {
  const Icon = ICONS[item.type] || Film
  return <div className={`card card-${item.type}`}>
    <button className="card-poster" onClick={() => onOpen(item)} aria-label={`Abrir ${item.name}`}>
      <span className="card-fallback"><Icon size={26} /></span>
      {item.logo && <img src={item.logo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={e => { e.currentTarget.style.display = 'none' }} />}
      {item.type === 'live' && <span className="live-tag">AO VIVO</span>}
      {watched && <span className="card-watched">Assistido</span>}
      {progress > 0 && <span className="card-progress"><i style={{ width: `${Math.min(100, progress)}%` }} /></span>}
    </button>
    {onRemove && <button className="card-remove" onClick={onRemove} aria-label="Remover de continuar assistindo"><X size={14} /></button>}
    <div className="card-info"><div><b title={item.name}>{item.name}</b><small>{item.label}</small></div>
      <button className={`heart${fav ? ' on' : ''}`} onClick={() => onToggleFav(item)} aria-pressed={fav} aria-label={fav ? 'Tirar da minha lista' : 'Adicionar à minha lista'}>
        <Heart size={17} fill={fav ? 'currentColor' : 'none'} />
      </button>
    </div>
  </div>
}
export default memo(MediaCard)
