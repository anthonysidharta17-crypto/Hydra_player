import { useEffect, useState } from 'react'
import { ArrowLeft, Heart, Play, Star, ExternalLink } from 'lucide-react'
import LoadState from '../components/LoadState'
import { useApp } from '../context/AppContext'
import { fetchMovieDetail, fetchSeriesDetail, enrichSynopsis } from '../core/details'
export default function Detail({ type,id }) {
  const { getItem,creds,status,favoriteIds,toggleFavorite,play,navigate } = useApp()
  const item = getItem(id), back = () => navigate(type==='movie'?'filmes':'series')
  const [info,setInfo] = useState(null), [error,setError] = useState(''), [season,setSeason] = useState(null), [attempt,setAttempt] = useState(0)
  const sid = item?.sid
  useEffect(() => {
    if (!sid) return undefined
    const ctrl = new AbortController(); setInfo(null); setError('')
    const fetcher = type==='movie' ? fetchMovieDetail : fetchSeriesDetail
    fetcher(creds,sid,ctrl.signal).then(async data => {
      if (!data.plot) {
        const meta = await enrichSynopsis(item.name,type,String(data.release||'').slice(0,4),ctrl.signal)
        if (meta) data = { ...data,...meta }
      }
      if (!ctrl.signal.aborted) { setInfo(data); setSeason(data.seasons[0] ?? null) }
    }).catch(err => { if (!ctrl.signal.aborted) setError(err.message || 'Não foi possível carregar os detalhes.') })
    return () => ctrl.abort()
  },[creds,sid,type,attempt,item?.name])
  if (!item) return status[type]==='loading' ? <LoadState text="Carregando…"/> : <div><button className="back-link" onClick={back}><ArrowLeft size={16}/> Voltar</button><p className="empty-note">Este título não está mais no catálogo.</p></div>
  const fav = favoriteIds.has(item.id), cover = info?.cover || item.logo, episodes = info?.episodes?.filter(ep => ep.season===season) || []
  const year = String(info?.release||'').slice(0,4), meta = [year,info?.duration,info?.genre].filter(Boolean)
  return <div className="detail"><button className="back-link" onClick={back}><ArrowLeft size={16}/> Voltar</button>
    <section className="detail-hero">{(info?.backdrop||cover) && <div className="detail-bg" style={{backgroundImage:`url("${info?.backdrop||cover}")`}}/>}
      <div className="detail-body"><div className="detail-cover">{cover && <img src={cover} alt="" referrerPolicy="no-referrer"/>}</div><div className="detail-text">
        <h2>{item.name}</h2><div className="detail-meta">{info?.rating>0 && <span className="rating"><Star size={14} fill="currentColor"/> {info.rating.toFixed(1)}</span>}{meta.map(m=><span key={m}>{m}</span>)}</div>
        <div className="detail-actions">{type==='movie' && <button className="btn-primary" onClick={() => play(item)}><Play size={16} fill="currentColor"/> Assistir</button>}
          {type==='series' && info?.episodes?.[0] && <button className="btn-primary" onClick={() => play(item,info.episodes[0])}><Play size={16} fill="currentColor"/> Assistir ep. 1</button>}
          <button className="btn-outline" onClick={() => toggleFavorite(item)} aria-pressed={fav}><Heart size={16} fill={fav?'currentColor':'none'}/> {fav?'Na minha lista':'Minha lista'}</button></div>
        {!info&&!error && <LoadState text="Buscando detalhes e sinopse…"/>}{error && <LoadState error={error} onRetry={() => setAttempt(n=>n+1)}/>}
        {info && <><p className="plot">{info.plot || 'O provedor não disponibilizou uma sinopse e não encontramos uma descrição correspondente na fonte pública consultada.'}</p>
          {info.plotSource && <a className="source-link" href={info.plotUrl} target="_blank" rel="noreferrer">Fonte da sinopse: {info.plotSource} <ExternalLink size={13}/></a>}
          {info.cast && <p className="credit"><b>Elenco:</b> {info.cast}</p>}{info.director && <p className="credit"><b>Direção:</b> {info.director}</p>}</>}
      </div></div>
    </section>
    {type==='series'&&info&&<section className="episodes">{info.seasons.length>1&&<div className="chips">{info.seasons.map(s=><button key={s} className={`chip${s===season?' strong':''}`} onClick={()=>setSeason(s)}>Temporada {s}</button>)}</div>}
      {info.episodes.length===0&&<p className="empty-note">Nenhum episódio disponível.</p>}<div className="episode-list">{episodes.map(ep=><button key={ep.id} className="episode" onClick={()=>play(item,ep)}><span className="ep-num">{ep.num}</span><span className="ep-title"><b>{ep.title}</b>{ep.duration&&<small>{ep.duration}</small>}</span><Play size={16}/></button>)}</div>
    </section>}
  </div>
}
