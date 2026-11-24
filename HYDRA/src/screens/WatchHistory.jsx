import { useMemo, useState } from 'react'
import { Play, Trash2, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { loadHistory, clearHistory, removeProgress } from '../core/history'
import { clearLastEpisodes, removeLastEpisode } from '../core/playerPrefs'
const pctOf = h => (h.d > 0 ? Math.min(100, Math.round(h.t / h.d * 100)) : 0)
const isDone = h => h.d > 0 && h.t / h.d >= 0.95
export default function WatchHistory() {
  const { getItem, play, showToast } = useApp()
  const [tab, setTab] = useState('continuar'), [tick, setTick] = useState(0)
  const all = useMemo(() => loadHistory().map(h => ({ ...h, item: getItem(h.id) })).filter(h => h.item && h.item.type !== 'live'), [getItem, tick])
  const items = all.filter(h => (tab === 'assistidos' ? isDone(h) : h.item.type === 'series' || !isDone(h)))
  const clear = () => { if (window.confirm('Apagar todo o histórico e as marcações de assistido?')) { clearHistory(); clearLastEpisodes(); setTick(t => t + 1); showToast('Histórico apagado.') } }
  const remove = h => { removeProgress(h.id); if (h.item.type === 'series') removeLastEpisode(h.item.sid); setTick(t => t + 1) }
  return <div className="page-narrow"><div className="page-heading"><div><h2 className="page-title">Continuar assistindo</h2><p className="page-sub">Retome de onde você parou e veja o que já assistiu.</p></div><button className="btn-outline" onClick={clear}><Trash2 size={15}/> Limpar</button></div>
    <div className="tab-row"><button className={tab === 'continuar' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('continuar')}>Continuar</button><button className={tab === 'assistidos' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('assistidos')}>Assistidos</button></div>
    {!items.length && <p className="empty-note">{tab === 'assistidos' ? 'Você ainda não terminou nenhum título neste aparelho.' : 'Nada para continuar por enquanto. O que você começar a assistir aparece aqui.'}</p>}
    <div className="history-list">{items.map(h => { const progress = pctOf(h); return <article key={h.id} className="history-item">
      <div className="history-poster">{h.item.logo && <img src={h.item.logo} alt=""/>}</div>
      <div className="history-info"><b>{h.item.name}</b><small>{isDone(h) ? 'Assistido' : progress > 0 ? `${progress}% assistido` : 'Reprodução iniciada'} · {new Date(h.at).toLocaleDateString('pt-BR')}</small><div className="progress-track"><i style={{ width: `${isDone(h) ? 100 : progress}%` }}/></div></div>
      {tab === 'assistidos' && h.item.type === 'movie'
        ? <button className="btn-outline small" onClick={() => play(h.item, { fromStart: true })}><Play size={15}/> De novo</button>
        : <button className="btn-primary small" onClick={() => play(h.item)}><Play size={15}/> Continuar</button>}
      <button className="btn-outline small" onClick={() => remove(h)} aria-label="Remover da lista"><X size={15}/></button>
    </article> })}</div>
  </div>
}
