// Histórico de reprodução (usado por "continuar assistindo"; o player grava a partir da etapa 3).
const KEY = 'hydra.progress'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }

export function loadHistory() {
  return Object.entries(read())
    .map(([id, p]) => ({ id, t: p.t || 0, d: p.d || 0, at: p.at || 0 }))
    .sort((a, b) => b.at - a.at)
}
export function saveProgress(id, time, duration) {
  const map = read()
  map[id] = { t: Math.floor(time), d: Math.floor(duration || 0), at: Date.now() }
  const ids = Object.keys(map)
  if (ids.length > 300) ids.sort((a, b) => map[a].at - map[b].at).slice(0, ids.length - 300).forEach(k => delete map[k])
  try { localStorage.setItem(KEY, JSON.stringify(map)) } catch { /* sem espaço */ }
}
export const clearHistory = () => { try { localStorage.removeItem(KEY) } catch { /* ignora */ } }
