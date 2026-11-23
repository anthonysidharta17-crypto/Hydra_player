import { useMemo, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import MediaGrid from '../components/MediaGrid'
import LoadState from '../components/LoadState'
import { useApp } from '../context/AppContext'
import { TYPE_LABEL, strip } from '../core/catalog'
const TABS = [['all','Tudo'],['latest','Lançamentos'],['cats','Categorias']]
const UNIT = { live:'canais', movie:'filmes', series:'séries' }
const fmt = n => n.toLocaleString('pt-BR')
export default function Browse({ type }) {
  const { catalog,status,errors,reload,views,setView } = useApp(); const [filter,setFilter] = useState('')
  const data = catalog[type], view = views[type], group = data && view.group ? data.groups.find(g => g.id === view.group) : null
  const shortcuts = useMemo(() => data ? [...data.groups].sort((a,b) => b.items.length-a.items.length).slice(0,12) : [],[data])
  const shownGroups = useMemo(() => { if (!data) return []; const term = strip(filter).trim(); return term ? data.groups.filter(g => strip(g.label).includes(term)) : data.groups },[data,filter])
  if (!data) return status[type] === 'error' ? <LoadState error={errors[type]} onRetry={() => reload(type)}/> : <LoadState text={`Carregando ${TYPE_LABEL[type].toLowerCase()}…`}/>
  if (group) return <div><button className="back-link" onClick={() => setView(type,{group:null})}><ArrowLeft size={16}/> Voltar</button><div className="section-head"><h2>{group.label}</h2><small>{fmt(group.items.length)} {UNIT[type]}</small></div><MediaGrid items={group.items}/></div>
  return <div><div className="tabs" role="tablist">{TABS.map(([id,label]) => <button key={id} role="tab" aria-selected={view.tab===id} className={`tab${view.tab===id?' active':''}`} onClick={() => setView(type,{tab:id,group:null})}>{label}</button>)}</div>
    {view.tab==='all' && <><div className="chips">{shortcuts.map(g => <button key={g.id} className="chip" onClick={() => setView(type,{group:g.id})}>{g.label}</button>)}<button className="chip strong" onClick={() => setView(type,{tab:'cats'})}>Ver todas</button></div><div className="section-head"><h2>{TYPE_LABEL[type]}</h2><small>{fmt(data.items.length)} {UNIT[type]}</small></div><MediaGrid items={data.items}/></>}
    {view.tab==='latest' && <><div className="section-head"><h2>Lançamentos</h2><small>mais recentes no servidor</small></div><MediaGrid items={data.latest} empty="O servidor não informou datas de inclusão para estes títulos."/></>}
    {view.tab==='cats' && <><div className="field search-field"><Search size={18}/><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar categoria" aria-label="Buscar categoria"/></div>{shownGroups.length ? <div className="cat-grid">{shownGroups.map(g => <button key={g.id} className="cat-tile" onClick={() => setView(type,{group:g.id})}><b>{g.label}</b><small>{fmt(g.items.length)} {UNIT[type]}</small></button>)}</div> : <p className="empty-note">Nenhuma categoria encontrada.</p>}</>}
  </div>
}
