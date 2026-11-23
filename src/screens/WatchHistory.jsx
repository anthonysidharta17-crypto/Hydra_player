import { useMemo, useState } from 'react'
import { Play, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { loadHistory, clearHistory } from '../core/history'
import { clearLastEpisodes } from '../core/playerPrefs'
export default function WatchHistory() {
  const {getItem,play,showToast} = useApp()
  const [tick,setTick]=useState(0)
  const items=useMemo(()=>loadHistory().map(h=>({...h,item:getItem(h.id)})).filter(h=>h.item),[getItem,tick])
  const clear=()=>{if(window.confirm('Apagar todo o histórico de reprodução?')){clearHistory();clearLastEpisodes();setTick(t=>t+1);showToast('Histórico apagado.')}}
  return <div className="page-narrow"><div className="page-heading"><div><h2 className="page-title">Histórico</h2><p className="page-sub">Retome de onde você parou.</p></div><button className="btn-outline" onClick={clear}><Trash2 size={15}/> Limpar</button></div>
    {!items.length&&<p className="empty-note">Ainda não há reproduções salvas neste aparelho.</p>}
    <div className="history-list">{items.map(h=>{const progress=h.d>0?Math.min(100,Math.round(h.t/h.d*100)):0;return <article key={h.id} className="history-item">
      <div className="history-poster">{h.item.logo&&<img src={h.item.logo} alt=""/>}</div><div className="history-info"><b>{h.item.name}</b><small>{progress>0?`${progress}% assistido`:'Reprodução iniciada'} · {new Date(h.at).toLocaleDateString('pt-BR')}</small><div className="progress-track"><i style={{width:`${progress}%`}}/></div></div>
      <button className="btn-primary small" onClick={()=>h.item.type==='live'?play(h.item):play(h.item)}><Play size={15}/> Continuar</button>
    </article>})}</div>
  </div>
}
