import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  X, Play, Pause, SkipForward, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize,
  Settings, ExternalLink, AlertTriangle, Loader2, Languages, List
} from 'lucide-react'
import { callApi } from '../core/api'
import { mediaUrl } from '../core/xtream'
import { saveProgress, getProgress } from '../core/history'
import { loadPrefs, savePrefs, getLastEpisode, setLastEpisode } from '../core/playerPrefs'
import { detectDevice, bufferProfile, planFormats, swapProtocol, explainFailure } from './ai'
import { startAttempt } from './engine'
import PrefsPanel from './PrefsPanel'
import './player.css'

const fmt = s => {
  if (!isFinite(s) || s < 0) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const x = Math.floor(s % 60)
  return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(x).padStart(2, '0')}`
}

const isPt = t => /^pt/i.test(t.lang || t.language || '') || /portugu|\bpt\b|brasil|dublad|\bdub\b/i.test(t.label || '')

function srtToVtt(text) {
  const t = text.replace(/\r+/g, '').replace(/^\uFEFF/, '').trim()
  if (/^WEBVTT/.test(t)) return `${t}\n`
  return `WEBVTT\n\n${t.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')}\n`
}

async function readSubtitleFile(file) {
  const buf = await file.arrayBuffer()
  let text
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf) } catch { text = new TextDecoder('windows-1252').decode(buf) }
  return srtToVtt(text)
}

// Lista plana de episódios de uma série, em ordem.
async function loadEpisodes(creds, item, signal) {
  const info = await callApi(creds, 'get_series_info', { series_id: item.sid }, { signal })
  const raw = info?.episodes || {}
  const out = []
  if (Array.isArray(raw)) raw.forEach(g => (Array.isArray(g) ? g : [g]).forEach(ep => ep && out.push(ep)))
  else Object.entries(raw).forEach(([season, arr]) => (arr || []).forEach(ep => out.push({ ...ep, season: ep.season ?? season })))
  return out
    .filter(ep => ep.id != null)
    .map((ep, i) => ({
      id: String(ep.id),
      season: Number(ep.season) || 1,
      num: Number(ep.episode_num) || i + 1,
      title: String(ep.title || '').trim() || `Episódio ${Number(ep.episode_num) || i + 1}`,
      ext: ep.container_extension || 'mp4'
    }))
    .sort((a, b) => a.season - b.season || a.num - b.num)
}

function startFor(source, prefs, item) {
  if (source.kind === 'live' || !prefs.resume) return 0
  let t = 0
  let d = 0
  if (source.kind === 'series') {
    const last = getLastEpisode(item.sid)
    if (last && last.id === source.id) { t = last.t; d = last.d }
  } else {
    const p = getProgress(item.id)
    if (p) { t = p.t; d = p.d }
  }
  return t > 10 && (!d || t < d - 30) ? t : 0
}

export default function Player({ request, creds, onClose, showToast }) {
  const item = request.item
  const videoRef = useRef(null)
  const boxRef = useRef(null)
  const device = useMemo(detectDevice, [])
  const profile = useMemo(() => bufferProfile(device), [device])

  const [prefs, setPrefs] = useState(loadPrefs)
  const [episodes, setEpisodes] = useState([])
  const [epId, setEpId] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | playing | error
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState(null)
  const [run, setRun] = useState({ n: 0, from: 0, key: null })
  const [paused, setPaused] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const [muted, setMuted] = useState(false)
  const [show, setShow] = useState(true)
  const [menu, setMenu] = useState(null) // tracks | prefs | eps
  const [tracks, setTracks] = useState({ audio: [], subs: [], audioNow: -1, subNow: -1 })
  const [full, setFull] = useState(false)

  const credsRef = useRef(creds)
  credsRef.current = creds
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs
  const handleRef = useRef(null)
  const idxRef = useRef(0)
  const failuresRef = useRef([])
  const manualRef = useRef(false)
  const checkedRef = useRef(false)
  const pushedRef = useRef(false)
  const hideTimer = useRef(0)
  const menuRef = useRef(null)
  menuRef.current = menu
  const fileRef = useRef(null)
  const act = useRef({})

  const episode = useMemo(() => episodes.find(e => e.id === epId) || null, [episodes, epId])
  const source = useMemo(() => {
    if (item.type === 'series') {
      if (!episode) return null
      return {
        kind: 'series', id: episode.id, ext: episode.ext, key: `series-${episode.id}`,
        sub: `Temporada ${episode.season}, episódio ${episode.num}: ${episode.title}`
      }
    }
    return { kind: item.type, id: item.sid, ext: item.ext || (item.type === 'live' ? '' : 'mp4'), key: item.id, sub: '' }
  }, [item, episode])
  const sourceRef = useRef(null)
  sourceRef.current = source
  const candidates = useMemo(() => (source ? planFormats(source.kind, source.ext, device) : []), [source, device])

  const epIndex = episodes.findIndex(e => e.id === epId)
  const nextEp = epIndex >= 0 ? episodes[epIndex + 1] : null
  const live = source?.kind === 'live'
  const canSeek = isFinite(dur) && dur > 0

  // ---- Interface: mostrar e esconder controles ----
  const poke = useCallback(() => {
    setShow(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      const v = videoRef.current
      const focused = boxRef.current?.querySelector('.pl-bottom :focus')
      if (v && !v.paused && !menuRef.current && !focused) setShow(false)
    }, 3500)
  }, [])

  // ---- Progresso ----
  const persist = useCallback(() => {
    const v = videoRef.current
    const s = sourceRef.current
    if (!v || !s || s.kind === 'live') return
    const t = v.currentTime
    const d = isFinite(v.duration) ? v.duration : 0
    if (!(t > 5)) return
    saveProgress(item.id, t, d)
    if (s.kind === 'series') setLastEpisode(item.sid, s.id, t, d)
  }, [item])

  useEffect(() => {
    const id = setInterval(persist, 5000)
    const hide = () => { if (document.visibilityState === 'hidden') persist() }
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', persist)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', persist)
      persist()
    }
  }, [persist])

  // ---- Voltar do Android fecha o player ----
  useEffect(() => {
    try { history.pushState({ hydraPlayer: true }, ''); pushedRef.current = true } catch { /* ignora */ }
    const pop = () => { pushedRef.current = false; onCloseRef.current() }
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])

  const close = useCallback(() => {
    persist()
    if (pushedRef.current) {
      history.back()
      setTimeout(() => { if (pushedRef.current) { pushedRef.current = false; onCloseRef.current() } }, 400)
    } else onCloseRef.current()
  }, [persist])

  // ---- Episódios (séries) ----
  useEffect(() => {
    if (item.type !== 'series') return undefined
    const ctrl = new AbortController()
    setNote('Carregando episódios…')
    loadEpisodes(credsRef.current, item, ctrl.signal).then(list => {
      if (!list.length) throw new Error('vazio')
      const last = getLastEpisode(item.sid)
      const wanted = request.episodeId != null ? String(request.episodeId) : null
      const pick = list.find(e => e.id === wanted) || list.find(e => last && e.id === last.id) || list[0]
      setEpisodes(list)
      setEpId(pick.id)
    }).catch(err => {
      if (ctrl.signal.aborted) return
      const text = err?.message && err.message !== 'vazio' ? err.message : 'A lista de episódios veio vazia. Tente de novo em instantes.'
      setProblem({ title: 'Não foi possível abrir a série', text })
      setPhase('error')
    })
    return () => ctrl.abort()
  }, [item, request.episodeId])

  // ---- Faixas de áudio e legendas ----
  const refreshTracks = useCallback(() => {
    const v = videoRef.current
    const h = handleRef.current
    if (!v) return
    const audio = h ? h.audioTracks() : []
    const subs = []
    Array.from(v.textTracks || []).forEach((t, i) => {
      if (t.kind === 'subtitles' || t.kind === 'captions') subs.push({ id: i, label: t.label || t.language || `Legenda ${subs.length + 1}`, lang: t.language || '', on: t.mode === 'showing' })
    })
    setTracks({ audio, subs, audioNow: h ? h.currentAudio() : -1, subNow: subs.find(s => s.on)?.id ?? -1 })
  }, [])

  const autoTracks = useCallback(() => {
    const v = videoRef.current
    const h = handleRef.current
    const p = prefsRef.current
    if (!v || !h || manualRef.current) return
    const audio = h.audioTracks()
    let ptAudio = false
    if (audio.length) {
      const pt = audio.find(isPt)
      const orig = audio.find(a => !isPt(a))
      if (p.audio === 'pt' && pt && h.currentAudio() !== pt.id) h.setAudio(pt.id)
      if (p.audio === 'original' && orig && h.currentAudio() !== orig.id) h.setAudio(orig.id)
      const now = audio.find(a => a.id === h.currentAudio())
      ptAudio = !!now && isPt(now)
    }
    const subs = Array.from(v.textTracks || []).filter(t => t.kind === 'subtitles' || t.kind === 'captions')
    const want = p.subs === 'on' || (p.subs === 'auto' && !ptAudio)
    const target = want ? subs.find(isPt) : null
    subs.forEach(t => { t.mode = t === target ? 'showing' : 'disabled' })
    refreshTracks()
  }, [refreshTracks])

  useEffect(() => {
    const v = videoRef.current
    const list = v?.textTracks
    if (!list) return undefined
    const onAdd = () => { autoTracks(); refreshTracks() }
    list.addEventListener('addtrack', onAdd)
    return () => list.removeEventListener('addtrack', onAdd)
  }, [autoTracks, refreshTracks])

  const showTrack = useCallback(idx => {
    const v = videoRef.current
    manualRef.current = true
    Array.from(v.textTracks || []).forEach((t, i) => {
      if (t.kind === 'subtitles' || t.kind === 'captions') t.mode = i === idx ? 'showing' : 'disabled'
    })
    refreshTracks()
  }, [refreshTracks])

  const pickAudio = useCallback(id => {
    manualRef.current = true
    handleRef.current?.setAudio(id)
    refreshTracks()
  }, [refreshTracks])

  const loadSubFile = useCallback(async file => {
    const v = videoRef.current
    if (!file || !v) return
    try {
      const vtt = await readSubtitleFile(file)
      const url = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }))
      const el = document.createElement('track')
      el.kind = 'subtitles'
      el.label = file.name.replace(/\.[^.]+$/, '')
      el.srclang = 'pt'
      el.src = url
      el.dataset.blob = url
      v.appendChild(el)
      manualRef.current = true
      Array.from(v.textTracks).forEach(t => { t.mode = t === el.track ? 'showing' : 'disabled' })
      refreshTracks()
      showToast?.('Legenda carregada.')
    } catch {
      showToast?.('Não foi possível ler este arquivo de legenda.')
    }
  }, [refreshTracks, showToast])

  const clearExternalTracks = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.querySelectorAll('track').forEach(el => { if (el.dataset.blob) URL.revokeObjectURL(el.dataset.blob); el.remove() })
  }, [])

  const updatePrefs = useCallback(patch => {
    const next = { ...prefsRef.current, ...patch }
    prefsRef.current = next
    setPrefs(next)
    savePrefs(next)
    if ('audio' in patch || 'subs' in patch) { manualRef.current = false; autoTracks() }
  }, [autoTracks])

  // ---- Laço de reprodução: tenta formatos até um funcionar ----
  useEffect(() => {
    if (!source) return undefined
    const video = videoRef.current
    let cancelled = false
    let current = null
    const from = run.key === source.key ? run.from : 0
    if (from === 0) failuresRef.current = []
    manualRef.current = false
    checkedRef.current = false
    clearExternalTracks()
    setTime(0); setDur(0); setPaused(false)

    ;(async () => {
      for (let i = from; i < candidates.length; i++) {
        if (cancelled) return
        idxRef.current = i
        setPhase('loading')
        setNote(i > 0 ? `Tentando outro formato (${i + 1} de ${candidates.length})…` : '')
        const cand = candidates[i]
        const c = credsRef.current
        const url = mediaUrl(cand.swap ? { ...c, server: swapProtocol(c.server) } : c, source.kind, source.id, cand.ext)
        current = startAttempt(video, {
          url, ext: cand.ext, kind: source.kind, profile,
          timeoutMs: source.kind === 'live' ? 15000 : 25000,
          onFatal: f => {
            if (cancelled) return
            failuresRef.current.push({ ...f, ext: cand.ext })
            setRun({ n: Date.now(), from: i + 1, key: source.key })
          }
        })
        const r = await current.promise
        if (cancelled) return
        if (r.ok) {
          handleRef.current = r.handle
          setPhase('playing'); setNote(''); setProblem(null)
          const start = startFor(source, prefsRef.current, item)
          if (start > 0) {
            try { video.currentTime = start } catch { /* ignora */ }
            showToast?.(`Retomando de ${fmt(start)}`)
          }
          video.play().catch(() => setPaused(true))
          autoTracks()
          setTimeout(() => { if (!cancelled) autoTracks() }, 1500)
          return
        }
        failuresRef.current.push({ ...r.fail, ext: cand.ext })
        current.destroy()
      }
      if (cancelled) return
      setProblem(explainFailure(failuresRef.current, device, source))
      setPhase('error')
    })()

    return () => {
      cancelled = true
      current?.destroy()
      handleRef.current = null
    }
  }, [source, candidates, run, device, profile, item, autoTracks, clearExternalTracks, showToast])

  // ---- Ações ----
  const toggle = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {}); else v.pause()
  }, [])
  const seek = useCallback(delta => {
    const v = videoRef.current
    if (!v || !isFinite(v.duration)) return
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta))
  }, [])
  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (v) v.muted = !v.muted
  }, [])
  const toggleFull = useCallback(() => {
    const el = boxRef.current
    if (!el) return
    if (!document.fullscreenElement) Promise.resolve(el.requestFullscreen?.()).catch(() => {})
    else document.exitFullscreen?.()
  }, [])
  const goEpisode = useCallback(id => {
    persist()
    setLastEpisode(item.sid, id, 0, 0)
    setEpId(id)
    setMenu(null)
  }, [item, persist])
  const goNext = useCallback(() => { if (nextEp) goEpisode(nextEp.id) }, [nextEp, goEpisode])
  const retry = useCallback(() => {
    failuresRef.current = []
    setRun(r => ({ n: r.n + 1, from: 0, key: sourceRef.current?.key ?? null }))
  }, [])
  const openExternal = useCallback(() => {
    const s = sourceRef.current
    if (!s || !candidates.length) return
    const url = mediaUrl(credsRef.current, s.kind, s.id, candidates[0].ext)
    const w = window.open(url, '_blank')
    if (!w && navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => showToast?.('Endereço copiado. Cole no VLC ou no MX Player.'))
        .catch(() => showToast?.('Não foi possível abrir outro player neste aparelho.'))
    } else if (!w) showToast?.('Não foi possível abrir outro player neste aparelho.')
  }, [candidates, showToast])
  const focusControls = useCallback(() => {
    boxRef.current?.querySelector('.pl-bottom [data-main]')?.focus()
  }, [])

  act.current = { toggle, seek, toggleMute, toggleFull, goNext, close, poke, focusControls, setMenu, skip: prefs.skip, menu, hasNext: !!nextEp }

  // ---- Teclado e controle remoto (D-pad) ----
  useEffect(() => {
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const a = act.current
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack') {
        e.preventDefault()
        if (a.menu) a.setMenu(null); else a.close()
        return
      }
      a.poke()
      const t = e.target
      const inUi = t && t.closest && t.closest('.pl-sheet, .pl-bottom, .pl-top, .pl-error')
      if (a.menu || inUi) return // dentro dos controles, o foco anda pelo D-pad normalmente
      switch (e.key) {
        case ' ': case 'Enter': case 'k': case 'MediaPlayPause': e.preventDefault(); a.toggle(); break
        case 'ArrowLeft': case 'j': e.preventDefault(); a.seek(-a.skip); break
        case 'ArrowRight': case 'l': e.preventDefault(); a.seek(a.skip); break
        case 'ArrowUp': case 'ArrowDown': e.preventDefault(); a.focusControls(); break
        case 'f': a.toggleFull(); break
        case 'm': a.toggleMute(); break
        case 'n': case 'MediaTrackNext': if (a.hasNext) a.goNext(); break
        case 'c': a.setMenu('tracks'); break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const h = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  useEffect(() => { poke(); return () => clearTimeout(hideTimer.current) }, [poke])

  // ---- Eventos do vídeo ----
  const onPlaying = () => {
    setBuffering(false); setPaused(false)
    if (!checkedRef.current && source && source.kind !== 'live') {
      checkedRef.current = true
      // Áudio sem imagem = vídeo que o aparelho não decodifica (ex.: H.265): passa para o próximo formato.
      setTimeout(() => {
        const v = videoRef.current
        if (v && !v.paused && v.currentTime > 1 && v.videoWidth === 0 && sourceRef.current === source) {
          failuresRef.current.push({ kind: 'nopicture', ext: candidates[idxRef.current]?.ext })
          setRun({ n: Date.now(), from: idxRef.current + 1, key: source.key })
        }
      }, 3500)
    }
  }
  const onEnded = () => {
    if (source && source.kind !== 'live') {
      const d = videoRef.current?.duration
      if (isFinite(d)) saveProgress(item.id, d, d)
    }
    if (source?.kind === 'series' && prefs.autoNext && nextEp) { showToast?.('Próximo episódio…'); goNext() } else setShow(true)
  }

  const showUi = show || phase !== 'playing' || paused || !!menu

  return (
    <div
      ref={boxRef}
      className={`pl-root${showUi ? ' pl-show' : ''}`}
      style={{ '--cue-size': `${prefs.subSize}%` }}
      onMouseMove={poke}
    >
      <video
        ref={videoRef}
        className="pl-video"
        playsInline
        autoPlay
        onPlaying={onPlaying}
        onPause={() => { setPaused(true); persist() }}
        onPlay={() => setPaused(false)}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onDurationChange={e => setDur(e.currentTarget.duration)}
        onVolumeChange={e => setMuted(e.currentTarget.muted)}
        onEnded={onEnded}
      />
      <div className="pl-tap" onClick={() => (show && phase === 'playing' ? setShow(false) : poke())} />

      {(phase === 'loading' || (buffering && phase === 'playing')) && (
        <div className="pl-center" role="status">
          <Loader2 className="pl-spin" size={44} />
          {phase === 'loading' && <p>{note || 'Carregando…'}</p>}
        </div>
      )}

      {phase === 'playing' && paused && (
        <button type="button" className="pl-bigplay" onClick={toggle} aria-label="Continuar">
          <Play size={44} />
        </button>
      )}

      {phase === 'error' && (
        <div className="pl-error" role="alert">
          <AlertTriangle size={38} />
          <h2>{problem?.title || 'Não foi possível reproduzir'}</h2>
          <p>{problem?.text}</p>
          {problem?.tip && <p className="pl-tip">{problem.tip}</p>}
          <div className="pl-error-actions">
            {source && <button type="button" className="pl-solid" onClick={retry}>Tentar de novo</button>}
            {source && <button type="button" onClick={openExternal}><ExternalLink size={18} /> Abrir em outro player</button>}
            <button type="button" onClick={close}>Voltar</button>
          </div>
        </div>
      )}

      <div className="pl-ui pl-top">
        <button type="button" className="pl-btn" onClick={close} aria-label="Fechar player"><X size={24} /></button>
        <div className="pl-title">
          <strong>{item.name}</strong>
          {source?.sub && <span>{source.sub}</span>}
        </div>
      </div>

      <div className="pl-ui pl-bottom">
        {canSeek && !live && (
          <div className="pl-seekrow">
            <span className="pl-time">{fmt(time)}</span>
            <input
              className="pl-seek"
              type="range"
              min="0"
              max={dur}
              step="1"
              value={Math.min(time, dur)}
              tabIndex={-1}
              aria-label="Posição do vídeo"
              onChange={e => { const v = videoRef.current; if (v) v.currentTime = Number(e.target.value); setTime(Number(e.target.value)) }}
            />
            <span className="pl-time">{fmt(dur)}</span>
          </div>
        )}
        <div className="pl-row">
          {canSeek && <button type="button" className="pl-btn" onClick={() => seek(-prefs.skip)} aria-label={`Voltar ${prefs.skip} segundos`}><RotateCcw size={24} /></button>}
          <button type="button" className="pl-btn pl-main" data-main onClick={toggle} aria-label={paused ? 'Continuar' : 'Pausar'}>
            {paused ? <Play size={28} /> : <Pause size={28} />}
          </button>
          {canSeek && <button type="button" className="pl-btn" onClick={() => seek(prefs.skip)} aria-label={`Avançar ${prefs.skip} segundos`}><RotateCw size={24} /></button>}
          {nextEp && <button type="button" className="pl-btn" onClick={goNext} aria-label="Próximo episódio"><SkipForward size={24} /></button>}
          {live && <span className="pl-live">Ao vivo</span>}
          <span className="pl-grow" />
          {episodes.length > 1 && <button type="button" className="pl-btn" onClick={() => setMenu('eps')} aria-label="Episódios"><List size={24} /></button>}
          <button type="button" className="pl-btn" onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Silenciar'}>{muted ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
          <button type="button" className="pl-btn" onClick={() => setMenu('tracks')} aria-label="Áudio e legendas"><Languages size={24} /></button>
          <button type="button" className="pl-btn" onClick={() => setMenu('prefs')} aria-label="Ajustes do player"><Settings size={24} /></button>
          <button type="button" className="pl-btn" onClick={toggleFull} aria-label={full ? 'Sair da tela cheia' : 'Tela cheia'}>{full ? <Minimize size={24} /> : <Maximize size={24} />}</button>
        </div>
      </div>

      {menu && (
        <div className="pl-sheet-wrap" onClick={() => setMenu(null)}>
          <div className="pl-sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="pl-sheet-head">
              <strong>{menu === 'tracks' ? 'Áudio e legendas' : menu === 'prefs' ? 'Ajustes do player' : 'Episódios'}</strong>
              <button type="button" className="pl-btn" onClick={() => setMenu(null)} aria-label="Fechar"><X size={22} /></button>
            </div>

            {menu === 'tracks' && (
              <div className="pl-lists">
                <h3>Áudio</h3>
                {tracks.audio.length === 0 && <p className="pl-empty">Este vídeo tem uma única faixa de áudio.</p>}
                {tracks.audio.map(a => (
                  <button key={a.id} type="button" className={`pl-item${a.id === tracks.audioNow ? ' on' : ''}`} onClick={() => pickAudio(a.id)}>{a.label}</button>
                ))}
                <h3>Legendas</h3>
                <button type="button" className={`pl-item${tracks.subNow === -1 ? ' on' : ''}`} onClick={() => showTrack(-1)}>Desativadas</button>
                {tracks.subs.map(s => (
                  <button key={s.id} type="button" className={`pl-item${s.id === tracks.subNow ? ' on' : ''}`} onClick={() => showTrack(s.id)}>{s.label}</button>
                ))}
                <button type="button" className="pl-item" onClick={() => fileRef.current?.click()}>Carregar arquivo (.srt ou .vtt)</button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".srt,.vtt,text/vtt,application/x-subrip"
                  hidden
                  onChange={e => { loadSubFile(e.target.files?.[0]); e.target.value = ''; setMenu(null) }}
                />
              </div>
            )}

            {menu === 'prefs' && <PrefsPanel prefs={prefs} onChange={updatePrefs} device={device} />}

            {menu === 'eps' && (
              <div className="pl-lists">
                {episodes.map(e => (
                  <button key={e.id} type="button" className={`pl-item${e.id === epId ? ' on' : ''}`} onClick={() => goEpisode(e.id)}>
                    Temporada {e.season}, episódio {e.num}: {e.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
