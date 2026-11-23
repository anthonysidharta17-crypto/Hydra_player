import { useEffect, useState } from 'react'
import { Menu, LogOut, X } from 'lucide-react'
import Logo from './Logo'
import Placeholder from '../screens/Placeholder'
import Settings from '../screens/Settings'
import { ROUTES } from '../routes'
import { APP_VERSION } from '../config'

// O que cada tela vai ter e em que etapa chega (telas ainda não construídas).
const PENDING = {
  inicio: [2, 'Destaque cinematográfico, "continuar assistindo" e recomendações.'],
  pesquisar: [2, 'Busca única em TV, filmes e séries, sem acento e sem diferença de maiúsculas.'],
  tv: [2, 'Canais ao vivo com Tudo, Lançamentos e Categorias.'],
  radio: [4, 'Canais ao vivo com "rádio" ou "FM" no nome ou na categoria.'],
  filmes: [2, 'Filmes com Tudo, Lançamentos e Categorias, e página de detalhes.'],
  series: [2, 'Séries com temporadas, episódios e Categorias.'],
  catchup: [4, 'Canais com arquivo: escolha canal, dia e programa.'],
  'minha-lista': [2, 'Seus favoritos, num só lugar.'],
  conta: [4, 'Dados da conta, expiração, backup, EPG e player externo.']
}

export default function Shell({ session, route, navigate, prefs, updatePrefs, onLogout, onSwitchLogin, onForget }) {
  const [open, setOpen] = useState(false)
  const current = ROUTES.find(r => r.id === route)
  const name = prefs.profileName || session.account.username

  useEffect(() => { setOpen(false) }, [route])
  useEffect(() => { document.querySelector('.content')?.scrollTo(0, 0) }, [route])

  let screen
  if (route === 'configuracoes') {
    screen = <Settings prefs={prefs} updatePrefs={updatePrefs} onLogout={onLogout} onSwitchLogin={onSwitchLogin} onForget={onForget} />
  } else {
    const [stage, text] = PENDING[route]
    screen = <Placeholder route={current} stage={stage}>{text}</Placeholder>
  }

  return (
    <div className="shell">
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Menu principal">
        <div className="sidebar-top">
          <Logo compact />
          <button className="icon-btn only-small" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>
        <nav>
          {ROUTES.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-link${id === route ? ' active' : ''}`}
              aria-current={id === route ? 'page' : undefined} onClick={() => navigate(id)}>
              <Icon size={19} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <small className="sidebar-version">{APP_VERSION}</small>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn only-small" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={22} /></button>
          <h1>{current.label}</h1>
          <span className="spacer" />
          <span className="user-chip" title={name}>{name}</span>
          <button className="btn-outline compact" onClick={onLogout}><LogOut size={16} /><span>Sair</span></button>
        </header>
        <main className="content">{screen}</main>
      </div>
    </div>
  )
}
