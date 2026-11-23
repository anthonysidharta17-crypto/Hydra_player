import { callApi } from './api'
import { HydraError } from './xtream'

export const strip = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export const TYPE_LABEL = { live: 'TV ao vivo', movie: 'Filmes', series: 'Séries' }
const SOURCES = {
  live: { cats: 'get_live_categories', list: 'get_live_streams' },
  movie: { cats: 'get_vod_categories', list: 'get_vod_streams' },
  series: { cats: 'get_series_categories', list: 'get_series' }
}
const LIST_TIMEOUT_MS = 120000

export function categoryLabel(name, type) {
  const text = String(name || '').trim()
  if (!text) return 'Outros'
  const prefix = type === 'live' ? '(?:canais?|tv|ao vivo|live)' : type === 'movie' ? '(?:filmes?|movies?|vod)' : '(?:s[eé]ries?|shows?)'
  const cleaned = text.replace(new RegExp(`^\\s*${prefix}\\s*[|:\\-–—/»>]+\\s*`, 'i'), '').trim()
  return cleaned || text
}

function toItem(raw, type, group) {
  const sid = String(raw.stream_id ?? raw.series_id ?? '')
  const name = String(raw.name || raw.title || 'Sem título').trim()
  return {
    id: `${type}-${sid}`, sid, type, name, key: strip(name),
    logo: raw.stream_icon || raw.cover || '', label: group.label, cat: group.id,
    added: Number(raw.added ?? raw.last_modified) || 0,
    rating: Number(raw.rating) || 0,
    ext: raw.container_extension || '',
    archive: Number(raw.tv_archive) === 1,
    archiveDays: Number(raw.tv_archive_duration) || 0,
    epgId: raw.epg_channel_id || ''
  }
}
const NEW_WORDS = /(lan[cç]amento|novidade|estreia|recente|\bnew\b|\bnovos?\b)/i
function latestOf(items, groups, limit = 240) {
  const dated = items.filter(item => item.added > 0)
  if (dated.length >= 12) return dated.sort((a, b) => b.added - a.added).slice(0, limit)
  return groups.filter(group => NEW_WORDS.test(group.name)).flatMap(group => group.items).slice(0, limit)
}

export async function loadCatalog(creds, type, signal) {
  const source = SOURCES[type]
  if (!source) throw new HydraError('type', 'Categoria de conteúdo inválida.')
  const [catList, rawList] = await Promise.all([
    callApi(creds, source.cats, {}, { signal }),
    callApi(creds, source.list, {}, { signal, timeoutMs: LIST_TIMEOUT_MS })
  ])
  if (!Array.isArray(rawList)) throw new HydraError('json', `O servidor não devolveu a lista de ${TYPE_LABEL[type].toLowerCase()}. Tente novamente.`)
  const map = new Map()
  ;(Array.isArray(catList) ? catList : []).forEach(cat => {
    const id = String(cat.category_id)
    map.set(id, { id, name: String(cat.category_name || ''), label: categoryLabel(cat.category_name, type), items: [] })
  })
  const other = { id: 'other', name: 'Outros', label: 'Outros', items: [] }
  const items = [], byId = new Map()
  for (const raw of rawList) {
    const group = map.get(String(raw.category_id)) || other
    const item = toItem(raw, type, group)
    if (!item.sid) continue
    group.items.push(item); items.push(item); byId.set(item.id, item)
  }
  const groups = [...map.values(), other].filter(group => group.items.length)
  return { type, items, groups, byId, latest: latestOf(items, groups) }
}

export function searchItems(items, query, cap = 1500) {
  const tokens = strip(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return []
  const starts = [], rest = []
  for (const item of items) {
    if (!tokens.every(token => item.key.includes(token))) continue
    ;(item.key.startsWith(tokens[0]) ? starts : rest).push(item)
    if (starts.length + rest.length >= cap) break
  }
  return [...starts, ...rest]
}

export function recommend(catalog, seedItems, limit = 30) {
  if (!seedItems.length) return []
  const seedIds = new Set(seedItems.map(item => item.id))
  const lists = ['movie', 'series'].map(type => {
    const data = catalog[type]
    if (!data) return []
    const counts = new Map()
    seedItems.filter(item => item.type === type).forEach(item => counts.set(item.cat, (counts.get(item.cat) || 0) + 1))
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id)
    return data.groups.filter(group => top.includes(group.id)).flatMap(group => group.items)
      .filter(item => !seedIds.has(item.id)).sort((a, b) => b.added - a.added).slice(0, limit)
  })
  const out = []
  for (let i = 0; i < limit && out.length < limit; i++) lists.forEach(list => list[i] && out.push(list[i]))
  return out.slice(0, limit)
}
