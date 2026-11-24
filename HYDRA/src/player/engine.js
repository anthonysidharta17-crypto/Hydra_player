// Motores de reprodução: HLS, MPEG-TS/FLV, DASH e vídeo nativo (MP4/MKV).
// startAttempt tenta UM endereço. Antes de "tocar" ele devolve { ok, handle } ou { ok:false, fail };
// depois de tocar, falhas fatais vão para onFatal. Nunca inclui a URL (senha) nas mensagens.
import { engineFor } from './ai'

export function startAttempt(video, opt) {
  const { url, ext, kind, profile, timeoutMs = 20000, onFatal } = opt
  let engine = engineFor(ext)
  let inst = null
  let destroyed = false
  let settled = false
  let timer = 0
  let resolveFn = () => {}

  const handle = {
    destroy,
    audioTracks: () => [],
    currentAudio: () => -1,
    setAudio: () => {}
  }
  const promise = new Promise(res => { resolveFn = res })

  function succeed() {
    if (settled || destroyed) return
    settled = true
    clearTimeout(timer)
    resolveFn({ ok: true, handle })
  }
  function fail(f) {
    if (destroyed) return
    if (!settled) { settled = true; clearTimeout(timer); resolveFn({ ok: false, fail: f }) } else onFatal?.(f)
  }

  const onPlaying = () => succeed()
  const onLoaded = () => { if (video.readyState >= 2) succeed() }
  const onError = () => {
    if (engine !== 'native') return
    const c = video.error?.code
    fail({ kind: c === 2 ? 'network' : c === 4 ? 'unsupported' : 'decode', code: c })
  }
  video.addEventListener('playing', onPlaying)
  video.addEventListener('loadeddata', onLoaded)
  video.addEventListener('error', onError)

  function destroy() {
    destroyed = true
    clearTimeout(timer)
    video.removeEventListener('playing', onPlaying)
    video.removeEventListener('loadeddata', onLoaded)
    video.removeEventListener('error', onError)
    try {
      if (inst?.type === 'hls') inst.hls.destroy()
      else if (inst?.type === 'mpegts') { inst.p.pause(); inst.p.unload(); inst.p.detachMediaElement(); inst.p.destroy() }
      else if (inst?.type === 'dash') inst.p.reset()
    } catch { /* ignora */ }
    try { video.removeAttribute('src'); video.load() } catch { /* ignora */ }
  }

  async function start() {
    try {
      if (engine === 'hls') {
        const Hls = (await import('hls.js')).default
        if (destroyed) return
        if (Hls.isSupported()) {
          const hls = new Hls(profile.hls)
          inst = { type: 'hls', hls }
          let net = 0
          let med = 0
          hls.on(Hls.Events.ERROR, (_e, d) => {
            if (!d.fatal) return
            const code = d.response?.code
            if (d.type === Hls.ErrorTypes.NETWORK_ERROR && !(code >= 400) && net++ < 2) { hls.startLoad(); return }
            if (d.type === Hls.ErrorTypes.MEDIA_ERROR && med++ < 2) { hls.recoverMediaError(); return }
            fail({ kind: d.type === Hls.ErrorTypes.NETWORK_ERROR ? 'network' : 'decode', status: code, detail: d.details })
          })
          hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}) })
          hls.loadSource(url)
          hls.attachMedia(video)
          handle.audioTracks = () => hls.audioTracks.map((t, i) => ({ id: i, label: t.name || t.lang || `Faixa ${i + 1}`, lang: t.lang || '' }))
          handle.currentAudio = () => hls.audioTrack
          handle.setAudio = i => { hls.audioTrack = i }
          return
        }
        engine = 'native' // sem MSE: deixa o aparelho tentar sozinho
      }

      if (engine === 'mpegts') {
        const mpegts = (await import('mpegts.js')).default
        if (destroyed) return
        if (mpegts.isSupported()) {
          const p = mpegts.createPlayer({ type: String(ext).toLowerCase() === 'flv' ? 'flv' : 'mpegts', isLive: kind === 'live', url }, profile.mpegts)
          inst = { type: 'mpegts', p }
          p.on(mpegts.Events.ERROR, (type, detail, info) => {
            fail({ kind: type === mpegts.ErrorTypes.NETWORK_ERROR ? 'network' : 'decode', status: info?.code, detail })
          })
          p.attachMediaElement(video)
          p.load()
          const r = p.play()
          if (r && r.catch) r.catch(() => {})
          return
        }
        engine = 'native'
      }

      if (engine === 'dash') {
        const mod = await import('dashjs')
        const dashjs = mod.default || mod
        if (destroyed) return
        const p = dashjs.MediaPlayer().create()
        inst = { type: 'dash', p }
        p.on('error', e => fail({ kind: 'decode', detail: e?.error?.code }))
        p.initialize(video, url, true)
        return
      }

      // Vídeo nativo (MP4, MKV, ou o que o aparelho aceitar).
      engine = 'native'
      video.src = url
      video.load()
      video.play().catch(() => {})
      const list = () => Array.from(video.audioTracks || [])
      handle.audioTracks = () => list().map((t, i) => ({ id: i, label: t.label || t.language || `Faixa ${i + 1}`, lang: t.language || '' }))
      handle.currentAudio = () => list().findIndex(t => t.enabled)
      handle.setAudio = i => { list().forEach((t, j) => { t.enabled = j === i }) }
    } catch (err) {
      fail({ kind: 'unsupported', detail: String(err?.message || '') })
    }
  }

  timer = setTimeout(() => fail({ kind: 'timeout' }), timeoutMs)
  start()
  return { promise, destroy }
}
