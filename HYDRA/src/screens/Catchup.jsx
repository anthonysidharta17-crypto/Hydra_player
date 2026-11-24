import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Play, History } from 'lucide-react'
import LoadState from '../components/LoadState'
import { useApp } from '../context/AppContext'
import { callApi } from '../core/api'
import { timeshiftUrl } from '../core/xtream'
const pad = n => String(n).padStart(2,'0')
const localParts = date => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
const parseStart = p => {
  const value = p.start_timestamp || p.start || p.start_time || p.datetime
  if (!value) return null
  const n = Number(value)
  if (Number.isFinite(n) && n > 1000000000) return new Date(n*1000)
  const d = new Date(String(value).replace(' ','T'))
  return Number.isNaN(d.getTime()) ? null : d
}
const parseMinutes = p => {
  const n = Number(p.duration_secs || p.duration_sec || p.duration)
  if (Number.isFinite(n) && n > 0) return n > 1000 ? Math.round(n/60) : n
  if (p.stop_timestamp && p.start_timestamp) return Math.max(1,Math.round((Number(p.stop_timestamp)-Number(p.start_timestamp))/60))
  if (p.stop && p.start) return Math.max(1,Math.round((new Date(String(p.stop).replace(' ','T'))-new Date(String(p.start).replace(' ','T')))/60000))
  return 60
}
// O Xtream envia título e descrição em base64; se não for base64 válido, usa o texto como veio.
const readText = value => {
  const text = String(value ?? '').trim()
  if (text.length >= 4 && text.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(text)) {
    try {
      const bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0))
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim()
      if (decoded && !/[\u0000-\u0008\u000e-\u001f]/.test(decoded)) return decoded
    } catch { /* não era base64 */ }
  }
  return text
}
// Horário do programa na hora do SERVIDOR (é a que a gravação espera).
const serverStamp = p => {
  const s = String(p.start || p.start_time || '')
  return /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s) ? `${s.replace('T', ' ').slice(0, 16)}:00` : null
}
export default function Catchup() {
  const { catalog,status,creds,play,reload,showToast } = useApp()
  const channels = useMemo(()=>catalog.live?.items.filter(i=>i.archive)||[],[catalog.live])
  const [channelId,setChannelId] = useState(''), [date,setDate] = useState(localParts(new Date())), [time,setTime] = useState('20:00'), [minutes,setMinutes] = useState(60)
  const [programs,setPrograms] = useState([]), [loading,setLoading] = useState(false), [programError,setProgramError] = useState(''), [busy,setBusy] = useState(false)
  const channel = channels.find(c=>c.id===channelId) || channels[0]
  useEffect(()=>{ if (!channelId && channels[0]) setChannelId(channels[0].id) },[channels,channelId])
  useEffect(()=>{
    if (!channel) return undefined
    const ctrl = new AbortController(); setLoading(true); setProgramError(''); setPrograms([])
    callApi(creds,'get_simple_data_table',{stream_id:channel.sid},{signal:ctrl.signal,timeoutMs:18000})
      .then(data=>{ const rows=Array.isArray(data?.epg_listings)?data.epg_listings:Array.isArray(data)?data:[]
        const mapped=rows.map(p=>({raw:p,title:readText(p.title||p.programme||p.name)||'Programa',start:parseStart(p),stamp:serverStamp(p),minutes:parseMinutes(p)})).filter(p=>p.start && p.minutes>0).sort((a,b)=>b.start-a.start)
        setPrograms(mapped)
      }).catch(err=>{ if(!ctrl.signal.aborted) setProgramError(err.message||'A grade de programação não está disponível para este canal.') })
      .finally(()=>{ if(!ctrl.signal.aborted) setLoading(false) })
    return ()=>ctrl.abort()
  },[channel?.id,creds])
  if (!catalog.live && status.live==='loading') return <LoadState text="Verificando canais com gravação disponível…"/>
  if (!catalog.live && status.live==='error') return <LoadState error="Não foi possível carregar os canais." onRetry={()=>reload('live')}/>
  if (!channels.length) return <div className="page-narrow"><h2 className="page-title">Catch-up</h2><p className="empty-note">Seu servidor não informou canais com gravação (TV Archive). O Catch-up só funciona quando o provedor oferece esse recurso.</p></div>
  const playAt = async (startValue,duration,title,stampOverride) => {
    if (!channel) return
    const startDate = startValue instanceof Date ? startValue : new Date(`${date}T${time}:00`)
    if (Number.isNaN(startDate.getTime()) || startDate.getTime() >= Date.now()) { showToast('Escolha um horário que já passou.'); return }
    const days = channel.archiveDays || 7
    if (Date.now()-startDate.getTime() > days*86400000) { showToast(`Este canal informa até ${days} dias de gravação.`); return }
    setBusy(true)
    try {
      const stamp = stampOverride || `${localParts(startDate)} ${pad(startDate.getHours())}:${pad(startDate.getMinutes())}:00`
      const url = timeshiftUrl(creds,channel.sid,stamp,duration)
      play(channel,{streamUrl:url})
      if (title) showToast(`Abrindo: ${title}`)
    } catch { showToast('Não foi possível preparar a gravação.') }
    finally { setBusy(false) }
  }
  return <div className="page-narrow"><div className="page-heading"><div><h2 className="page-title">Catch-up</h2><p className="page-sub">Assista novamente aos programas que o seu provedor manteve gravados.</p></div><History size={28}/></div>
    <section className="settings-card catch-card"><label className="form-label">Canal com gravação</label><select className="app-select" value={channel?.id||''} onChange={e=>setChannelId(e.target.value)}>{channels.map(c=><option key={c.id} value={c.id}>{c.name} {c.archiveDays?`· ${c.archiveDays} dias`:''}</option>)}</select>
      <div className="field-row"><div><label className="form-label">Data</label><input type="date" className="app-input" value={date} max={localParts(new Date())} onChange={e=>setDate(e.target.value)}/></div>
        <div><label className="form-label">Hora de início</label><input type="time" className="app-input" value={time} onChange={e=>setTime(e.target.value)}/></div></div>
      <label className="form-label">Duração</label><select className="app-select" value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>{[30,45,60,90,120,180].map(n=><option key={n} value={n}>{n} minutos</option>)}</select>
      <button className="btn-primary" disabled={busy} onClick={()=>playAt(null,minutes)}><Play size={16}/> Assistir gravação selecionada</button>
      <small className="hint-note">O limite de dias depende da informação enviada pelo servidor. Nem todos os provedores entregam uma grade EPG completa.</small>
    </section>
    <div className="section-head"><h3>Programação disponível</h3><small>{programs.length} itens</small></div>
    {loading && <LoadState text="Consultando a programação deste canal…"/>}
    {!loading && programs.length>0 && <div className="program-list">{programs.map((p,i)=><button key={`${p.start.getTime()}-${i}`} className="program" onClick={()=>{setDate(localParts(p.start));setTime(`${pad(p.start.getHours())}:${pad(p.start.getMinutes())}`);setMinutes(p.minutes);playAt(p.start,p.minutes,p.title,p.stamp)}}><span className="program-time">{p.stamp?p.stamp.slice(11,16):`${pad(p.start.getHours())}:${pad(p.start.getMinutes())}`}</span><span><b>{p.title}</b><small>{p.minutes} min</small></span><Play size={17}/></button>)}</div>}
    {!loading && !programs.length && <p className="hint-note">{programError || 'A grade não trouxe programas com horário. Você pode informar data, hora e duração manualmente acima.'}</p>}
  </div>
}
