// Detalhes de filme e série (get_vod_info / get_series_info).
import { callApi } from './api'

const first = value => (Array.isArray(value) ? value[0] : value)

function normalizeInfo(info = {}, movieData = {}) {
  const rating = Number(info.rating) || (Number(info.rating_5based) ? Number(info.rating_5based) * 2 : 0)
  return {
    cover: info.movie_image || info.cover || '',
    backdrop: first(info.backdrop_path) || '',
    plot: info.plot || info.description || '',
    cast: info.cast || info.actors || '',
    director: info.director || '',
    genre: info.genre || '',
    release: info.releasedate || info.release_date || info.releaseDate || '',
    duration: info.duration || '',
    rating,
    ext: movieData.container_extension || info.container_extension || ''
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
      id: `episode-${ep.id}`,
      sid: String(ep.id),
      type: 'episode',
      season: Number(season) || 0,
      num: Number(ep.episode_num) || index + 1,
      title: ep.title || `Episódio ${ep.episode_num || index + 1}`,
      logo: ep.info?.movie_image || '',
      duration: ep.info?.duration || '',
      plot: ep.info?.plot || '',
      ext: ep.container_extension || 'mp4'
    })))
  episodes.sort((a, b) => a.season - b.season || a.num - b.num)
  const seasons = [...new Set(episodes.map(ep => ep.season))]
  return { ...normalizeInfo(data?.info), seasons, episodes }
}
