// Preferências do player e último episódio visto de cada série (só no aparelho).
const PREFS_KEY = 'hydra.player.prefs'
const EP_KEY = 'hydra.lastepisode'

export const PREFS_DEFAULT = {
  audio: 'pt',      // 'pt' = dublado em português | 'original'
  subs: 'auto',     // 'off' | 'auto' (só se o áudio não for em português) | 'on'
  subSize: 100,     // % do tamanho padrão da legenda
  resume: true,     // retomar de onde parou
  skip: 10,         // segundos dos botões de salto
  autoNext: true,   // próximo episódio automático
  fit: 'contain'    // formato da imagem: 'contain' (ajustar) | 'cover' (preencher) | 'fill' (esticar)
}

export function loadPrefs() {
  try { return { ...PREFS_DEFAULT, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') } } catch { return { ...PREFS_DEFAULT } }
}
export function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* sem espaço */ }
}

const readEps = () => { try { return JSON.parse(localStorage.getItem(EP_KEY) || '{}') } catch { return {} } }

export function getLastEpisode(sid) {
  return readEps()[sid] || null
}
export function setLastEpisode(sid, id, t, d) {
  const map = readEps()
  map[sid] = { id: String(id), t: Math.floor(t || 0), d: Math.floor(d || 0), at: Date.now() }
  const keys = Object.keys(map)
  if (keys.length > 200) keys.sort((a, b) => map[a].at - map[b].at).slice(0, keys.length - 200).forEach(k => delete map[k])
  try { localStorage.setItem(EP_KEY, JSON.stringify(map)) } catch { /* sem espaço */ }
}
export function removeLastEpisode(sid) {
  const map = readEps()
  if (!(sid in map)) return
  delete map[sid]
  try { localStorage.setItem(EP_KEY, JSON.stringify(map)) } catch { /* sem espaço */ }
}

// Marcação de "assistido" (filme: id do item; episódio: "ep-<id>").
const WATCHED_KEY = 'hydra.watched'
const readWatched = () => { try { return JSON.parse(localStorage.getItem(WATCHED_KEY) || '{}') } catch { return {} } }
export const isWatched = id => !!readWatched()[id]
export function markWatched(id) {
  const map = readWatched()
  if (map[id]) return
  map[id] = Date.now()
  const keys = Object.keys(map)
  if (keys.length > 3000) keys.sort((a, b) => map[a] - map[b]).slice(0, keys.length - 3000).forEach(k => delete map[k])
  try { localStorage.setItem(WATCHED_KEY, JSON.stringify(map)) } catch { /* sem espaço */ }
}
// Limpa o último episódio visto e as marcações de assistido (usado em "Apagar histórico").
export const clearLastEpisodes = () => { try { localStorage.removeItem(EP_KEY); localStorage.removeItem(WATCHED_KEY) } catch { /* ignora */ } }
