// Favoritos ("Minha lista"): guarda só dados simples do título, nunca URLs.
const KEY = 'hydra.favorites'

export function loadFavorites() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list.filter(item => item?.id) : []
  } catch { return [] }
}
export function saveFavorites(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* sem espaço */ }
}
export const snapshot = ({ id, type, sid, name, logo, label, cat, added }) => ({ id, type, sid, name, key: '', logo, label, cat, added })
