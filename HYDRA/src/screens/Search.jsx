import { useDeferredValue, useMemo, useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import MediaGrid from '../components/MediaGrid'
import { useApp } from '../context/AppContext'
import { searchItems, TYPE_LABEL } from '../core/catalog'
const ORDER = ['live','movie','series']
export default function Search() {
  const { catalog, status } = useApp(); const [query,setQuery] = useState(''); const deferred = useDeferredValue(query)
  const results = useMemo(() => Object.fromEntries(ORDER.map(type => [type, catalog[type] ? searchItems(catalog[type].items,deferred) : []])),[catalog,deferred])
  const loading = ORDER.filter(type => status[type] === 'loading'), total = ORDER.reduce((n,t) => n + results[t].length,0), searching = deferred.trim().length > 0
  return <div><div className="field search-field"><SearchIcon size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar canais, filmes e séries" aria-label="Pesquisar" autoComplete="off"/></div>
    {loading.length > 0 && <p className="hint-note">Carregando: {loading.map(t => TYPE_LABEL[t]).join(', ')}. Resultados aparecem aos poucos.</p>}
    {!searching && <p className="empty-note">Digite para pesquisar. A busca ignora acentos e maiúsculas.</p>}
    {searching && total === 0 && loading.length === 0 && <p className="empty-note">Nada encontrado para “{deferred.trim()}”.</p>}
    {searching && ORDER.map(type => results[type].length > 0 && <section key={type} className="result-block"><div className="section-head"><h2>{TYPE_LABEL[type]}</h2><small>{results[type].length.toLocaleString('pt-BR')} resultados</small></div><MediaGrid items={results[type]}/></section>)}
  </div>
}
