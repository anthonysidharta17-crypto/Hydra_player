// Mini IA local do player: só regras sobre o aparelho e sobre a falha. Não usa servidor.

function supports(type) {
  try {
    const v = document.createElement('video')
    if (v.canPlayType(type)) return true
    return typeof MediaSource !== 'undefined' && !!MediaSource.isTypeSupported?.(type)
  } catch { return false }
}

export const DEVICE_LABEL = { tv: 'TV', phone: 'Celular', tablet: 'Tablet', desktop: 'Computador' }

// Detecta o tipo de aparelho, a rede e o que ele sabe decodificar.
export function detectDevice() {
  const ua = navigator.userAgent || ''
  const short = Math.min(screen.width || 0, screen.height || 0)
  let kind = 'desktop'
  if (/Android.*(\bTV\b|AFT|BRAVIA|AndroidTV|MiBOX)|SMART-?TV|Tizen|Web0S|HbbTV|CrKey/i.test(ua)) kind = 'tv'
  else if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && short >= 600)) kind = 'tablet'
  else if (/Android|iPhone|iPod|Mobile/i.test(ua)) kind = 'phone'

  const probe = document.createElement('video')
  const caps = {
    h264: supports('video/mp4; codecs="avc1.640028"'),
    hevc: supports('video/mp4; codecs="hvc1.1.6.L120.B0"') || supports('video/mp4; codecs="hev1.1.6.L120.B0"'),
    av1: supports('video/mp4; codecs="av01.0.08M.08"'),
    vp9: supports('video/webm; codecs="vp9"'),
    ac3: supports('audio/mp4; codecs="ac-3"'),
    eac3: supports('audio/mp4; codecs="ec-3"'),
    mkv: !!probe.canPlayType('video/x-matroska'),
    hlsNative: !!probe.canPlayType('application/vnd.apple.mpegurl'),
    mse: typeof MediaSource !== 'undefined' || typeof ManagedMediaSource !== 'undefined'
  }
  const c = navigator.connection || {}
  const slow = !!c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || '') || (c.downlink > 0 && c.downlink < 2.5)
  const memory = navigator.deviceMemory || 0
  const cores = navigator.hardwareConcurrency || 0
  const low = kind === 'tv' || (memory > 0 && memory <= 2) || (cores > 0 && cores <= 4)
  return { kind, memory, cores, low, slow, net: c.effectiveType || '', caps }
}

// Buffer e qualidade inicial conforme o aparelho e a rede.
export function bufferProfile(d) {
  return {
    hls: {
      maxBufferLength: d.low ? 20 : 40,
      maxMaxBufferLength: d.low ? 40 : 90,
      backBufferLength: d.low ? 10 : 30,
      startLevel: d.slow ? 0 : -1,
      capLevelToPlayerSize: true,
      enableWorker: true,
      manifestLoadingMaxRetry: 2,
      levelLoadingMaxRetry: 2,
      fragLoadingMaxRetry: 3
    },
    mpegts: {
      enableWorker: true,
      enableStashBuffer: true,
      stashInitialSize: d.low ? 512 : 384,
      autoCleanupSourceBuffer: true,
      autoCleanupMaxBackwardDuration: 60,
      autoCleanupMinBackwardDuration: 30
    }
  }
}

export const swapProtocol = server =>
  /^https:/i.test(server) ? String(server).replace(/^https:/i, 'http:') : String(server).replace(/^http:/i, 'https:')

export function engineFor(ext) {
  const e = String(ext || '').toLowerCase()
  if (e === 'm3u8' || e === 'm3u') return 'hls'
  if (e === 'ts' || e === 'flv') return 'mpegts'
  if (e === 'mpd') return 'dash'
  return 'native'
}

// Lista de tentativas, da mais provável para a menos provável, no mesmo endereço do servidor.
export function planFormats(kind, ext, d) {
  const hls = d.caps.mse || d.caps.hlsNative
  const exts = []
  const add = e => { if (e && !exts.includes(e)) exts.push(e) }
  if (kind === 'live') {
    if (hls) { add('m3u8'); add('ts') } else { add('ts'); add('m3u8') }
  } else {
    add(ext || 'mp4')
    add('mp4'); add('mkv')
    if (hls) add('m3u8')
    add('ts')
  }
  const list = exts.map(e => ({ ext: e, swap: false }))
  exts.slice(0, 2).forEach(e => list.push({ ext: e, swap: true })) // última chance: http ↔ https
  return list
}

// Traduz as falhas em um motivo provável, em português.
export function explainFailure(failures, d, source) {
  const has = fn => failures.some(fn)
  const status = failures.map(f => f.status).find(s => s >= 400)
  const tip = 'Você pode tentar "Abrir em outro player" (VLC ou MX Player), que têm decodificador próprio.'
  const title = 'Não foi possível reproduzir'

  if (status === 401 || status === 403) return { title, text: 'O servidor recusou o acesso. Pode haver outra tela usando esta conta ao mesmo tempo, ou o acesso foi bloqueado. Feche o conteúdo em outros aparelhos e tente de novo.' }
  if (status === 404) return { title, text: 'O servidor não encontrou este conteúdo. Ele pode ter saído do ar ou estar indisponível agora. Tente outro título.' }
  if (status >= 500) return { title, text: 'O servidor está com problema neste momento. Tente de novo em instantes.' }

  if (has(f => f.kind === 'nopicture')) {
    return { title, text: 'O áudio toca, mas a imagem não aparece. É o sinal típico de um vídeo 4K ou H.265 (HEVC) que este aparelho não consegue decodificar.', tip }
  }
  const decode = has(f => f.kind === 'decode' || f.kind === 'unsupported')
  if (decode && !d.caps.hevc) {
    return { title, text: 'Este aparelho não toca H.265 (HEVC) nem vídeos 4K, e é o motivo mais provável desta falha. Tentei os formatos MP4, MKV, M3U8 e TS sem sucesso.', tip }
  }
  if (decode && source?.ext && /mkv/i.test(source.ext) && !d.caps.mkv) {
    return { title, text: 'Este arquivo é MKV e o aparelho não abre esse formato diretamente. Tentei os outros formatos do mesmo endereço sem sucesso.', tip }
  }
  if (decode) {
    return { title, text: 'O vídeo ou o áudio usa um formato que o aparelho não reconhece (por exemplo, áudio AC3 ou EAC3). Tentei todos os formatos do mesmo endereço.', tip }
  }
  if (failures.length && failures.every(f => f.kind === 'network' || f.kind === 'timeout')) {
    return { title, text: 'Não consegui carregar o vídeo. A internet pode estar instável ou o servidor demorou demais. Teste outro conteúdo para saber se o problema é só neste.', tip }
  }
  return { title, text: 'Tentei todos os formatos disponíveis e nenhum abriu. Tente de novo em instantes.', tip }
}

const yes = v => (v ? 'Sim' : 'Não')
export function describeDevice(d) {
  return [
    ['Aparelho', DEVICE_LABEL[d.kind] || d.kind],
    ['Memória', d.memory ? `${d.memory} GB` : 'não informada'],
    ['Núcleos', d.cores || 'não informado'],
    ['Rede', d.net ? `${d.net}${d.slow ? ' (lenta)' : ''}` : 'não informada'],
    ['H.264', yes(d.caps.h264)],
    ['H.265 (HEVC)', yes(d.caps.hevc)],
    ['AV1', yes(d.caps.av1)],
    ['AC3 / EAC3', `${yes(d.caps.ac3)} / ${yes(d.caps.eac3)}`],
    ['MKV direto', yes(d.caps.mkv)],
    ['HLS / MSE', `${yes(d.caps.hlsNative)} / ${yes(d.caps.mse)}`],
    ['Buffer', d.low ? 'econômico' : 'normal']
  ]
}
