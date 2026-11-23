import { callApi } from './api'
import { strip } from './catalog'

const first = value => Array.isArray(value) ? value[0] : value
function normalizeInfo(info = {}, movieData = {}) {
  const rating = Number(info.rating) || (Number(info.rating_5based) ? Number(info.rating_5based) * 2 : 0)
  return {
    cover: info.movie_image || info.cover || '', backdrop: first(info.backdrop_path) || '',
    plot: info.plot || info.description || '', cast: info.cast || info.actors || '',
    director: info.director || '', genre: info.genre || '',
    release: info.releasedate || info.release_date || info.releaseDate || '',
    duration: info.duration || '', rating, ext: movieData.container_extension || info.container_extension || '',
    plotSource: ''
  }
}
export async function fetchMovieDetail(creds, sid, signal) {
  const data = await callApi(creds, 'get_vod_info', { vod_id: sid }, { signal })
  return { ...normalizeInfo(data?.info, data?.movie_data), seasons: [], episodes: [] }
}
export async function fetchSeriesDetail(creds, sid, signal) {
  const data = await callApi(creds, 'get_series_info', { series_id: sid }, { signal })
  const bySeason = data?.episodes || {}
  const episodes = Object.entries(bySeason).flatMap(([season, list]) =>
    (Array.isArray(list) ? list : []).map((ep, index) => ({
      id: `episode-${ep.id}`, sid: String(ep.id), type: 'episode', season: Number(season) || 0,
      num: Number(ep.episode_num) || index + 1, title: ep.title || `Episódio ${ep.episode_num || index + 1}`,
      logo: ep.info?.movie_image || '', duration: ep.info?.duration || '', plot: ep.info?.plot || '', ext: ep.container_extension || 'mp4'
    })))
  episodes.sort((a, b) => a.season - b.season || a.num - b.num)
  return { ...normalizeInfo(data?.info), seasons: [...new Set(episodes.map(ep => ep.season))], episodes }
}

// Enriquecimento opcional e verificável: procura sinopse na Wikipédia em pt-BR e,
// só quando necessário, em inglês. Exige título coincidente; não inventa sinopses.
const META_KEY = 'hydra.metadata.v1'
const cleanTitle = value => strip(String(value || '').replace(/\s*\([^)]*\)\s*$/, '').replace(/[.:,_-]/g, ' ')).replace(/\s+/g, ' ').trim()
function cacheRead() { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') } catch { return {} } }
function cacheWrite(key, value) { try { const map = cacheRead(); map[key] = { ...value, at: Date.now() }; localStorage.setItem(META_KEY, JSON.stringify(map)) } catch {} }

async function wikiLookup(title, kind, lang, year, signal) {
  const typeWord = kind === 'movie' ? 'filme' : 'série de televisão'
  const search = `${title} ${year || ''} ${typeWord}`.trim()
  const api = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(search)}&srlimit=5&format=json&origin=*`
  const res = await fetch(api, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data = await res.json()
  const target = cleanTitle(title)
  const hits = data?.query?.search || []
  const hit = hits.map(x => ({ ...x, score: cleanTitle(x.title) === target ? 2 : cleanTitle(x.title).includes(target) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score)[0]
  if (!hit || hit.score === 0) return null
  const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`
  const summaryRes = await fetch(summaryUrl, { signal, headers: { Accept: 'application/json' } })
  if (!summaryRes.ok) return null
  const summary = await summaryRes.json()
  if (!summary.extract || summary.type === 'disambiguation') return null
  return { plot: summary.extract, plotSource: `Wikipédia (${lang === 'pt' ? 'pt-BR' : 'en'})`, plotUrl: summary.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}` }
}
export async function enrichSynopsis(title, kind, year, signal) {
  const key = `${kind}:${cleanTitle(title)}:${year || ''}`
  const cached = cacheRead()[key]
  if (cached && Date.now() - cached.at < 30 * 86400000) return cached.value || null
  try {
    const result = await wikiLookup(title, kind, 'pt', year, signal) || await wikiLookup(title, kind, 'en', year, signal)
    if (result) cacheWrite(key, { value: result })
    return result
  } catch (error) {
    if (signal?.aborted) throw error
    return null
  }
}
