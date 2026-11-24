import { useMemo, useState } from 'react'
import { Radio as RadioIcon, Search, Star } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { strip } from '../core/catalog'
import LoadState from '../components/LoadState'
// Só entra o que se chama rádio/FM no nome ou na categoria (sem pegar canal de TV de música).
const WORDS = /\b(radio|radios|fm)\b/
export default function Radio() {
  const { catalog,status,play,reload,favoriteIds,toggleFavorite } = useApp(), [query,setQuery] = useState('')
  const all = catalog.live?.items || []
  const stations = useMemo(() => {
    const q = strip(query).trim()
    return all.filter(i => WORDS.test(strip(`${i.name} ${i.label}`)) && (!q || strip(`${i.name} ${i.label}`).includes(q)))
      .sort((a,b) => (favoriteIds.has(b.id)-favoriteIds.has(a.id)) || a.key.localeCompare(b.key))
  },[all,query,favoriteIds])
  if (!catalog.live && status.live==='loading') return <LoadState text="Procurando estações de rádio no catálogo…"/>
  if (!catalog.live && status.live==='error') return <LoadState error="Não foi possível ler o catálogo de TV e rádio." onRetry={()=>reload('live')}/>
  return <div className="page-narrow"><div className="page-heading"><div><h2 className="page-title">Rádio</h2><p className="page-sub">Estações encontradas nas listas fornecidas pelo seu servidor.</p></div><RadioIcon size={28}/></div>
    <div className="field search-field"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar estação" aria-label="Buscar estação"/></div>
    {stations.length ? <div className="station-list">{stations.map(s=><div key={s.id} style={{display:'flex',gap:'.5rem',alignItems:'stretch'}}>
      <button className="station" style={{flex:1}} onClick={()=>play(s)}><span className="station-icon"><RadioIcon size={20}/></span><span><b>{s.name}</b><small>{s.label}</small></span><span className="station-play">Ouvir</span></button>
      <button className="btn-outline compact" onClick={()=>toggleFavorite(s)} aria-label={favoriteIds.has(s.id)?'Tirar dos favoritos':'Adicionar aos favoritos'} aria-pressed={favoriteIds.has(s.id)}><Star size={17} fill={favoriteIds.has(s.id)?'currentColor':'none'}/></button>
    </div>)}</div> : <p className="empty-note">Não encontrei estações pelo nome ou categoria. O fornecedor precisa incluir rádios no seu catálogo Xtream.</p>}
  </div>
}
