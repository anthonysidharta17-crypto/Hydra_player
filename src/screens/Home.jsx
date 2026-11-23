import { useEffect, useMemo, useState } from 'react'
import { Info, Heart } from 'lucide-react'
import Row from '../components/Row'
import LoadState from '../components/LoadState'
import { useApp } from '../context/AppContext'
import { recommend } from '../core/catalog'
import { fetchMovieDetail } from '../core/details'
import { loadHistory } from '../core/history'

const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)

export default function Home() {
  const { catalog, status, creds, favorites, favoriteIds, toggleFavorite, openItem, getItem, navigate } = useApp()
  const [heroInfo, setHeroInfo] = useState(null)

  // Destaque: um dos lançamentos mais recentes, trocando a cada dia.
  const hero = useMemo(() => {
    const pool = (catalog.movie?.latest || []).filter(item => item.logo).slice(0, 15)
    return pool.length ? pool[dayOfYear() % pool.length] : null
  }, [catalog.movie])

  useEffect(() => {
    if (!hero) return undefined
    const ctrl = new AbortController()
    setHeroInfo(null)
    fetchMovieDetail(creds, hero.sid, ctrl.signal).then(setHeroInfo).catch(() => {})
    return () => ctrl.abort('outer')
  }, [hero, creds])

  const resume = useMemo(() => loadHistory()
    .filter(h => h.d > 0 && h.t > 10 && h.t / h.d < 0.95)
    .map(h => getItem(h.id)).filter(Boolean), [getItem])

  const seeds = useMemo(() => [...favorites, ...resume], [favorites, resume])
  const picks = useMemo(() => recommend(catalog, seeds), [catalog, seeds])

  const loading = ['live', 'movie', 'series'].every(t => status[t] === 'loading' && !catalog[t])
  if (loading) return <LoadState text="Carregando seu catálogo…" />

  const bg = heroInfo?.backdrop || hero?.logo
  const fav = hero ? favoriteIds.has(hero.id) : false

  return (
    <div>
      {hero && (
        <section className="hero">
          {bg && <div className="hero-bg" style={{ backgroundImage: `url("${bg}")` }} />}
          <div className="hero-content">
            <span className="eyebrow">EM DESTAQUE</span>
            <h2>{hero.name}</h2>
            <p>{heroInfo?.plot || 'Um dos lançamentos mais recentes do seu catálogo.'}</p>
            <div className="detail-actions">
              <button className="btn-primary" onClick={() => openItem(hero)}><Info size={16} /> Ver detalhes</button>
              <button className="btn-outline" onClick={() => toggleFavorite(hero)} aria-pressed={fav}>
                <Heart size={16} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'Na minha lista' : 'Minha lista'}
              </button>
            </div>
          </div>
        </section>
      )}
      <Row title="Continuar assistindo" items={resume} />
      <Row title="Recomendados para você" hint="com base na sua lista" items={picks} />
      <Row title="Filmes novos" items={catalog.movie?.latest || []} />
      <Row title="Séries novas" items={catalog.series?.latest || []} />
      {!hero && !catalog.movie?.latest?.length && !catalog.series?.latest?.length && (
        <p className="empty-note">Seu catálogo carregou. Use o menu para navegar por TV, filmes e séries.</p>
      )}
      {!favorites.length && <p className="hint-note">Dica: toque no coração dos títulos para montar sua lista e receber recomendações.</p>}
      <button className="btn-outline" onClick={() => navigate('pesquisar')}>Pesquisar</button>
    </div>
  )
}
