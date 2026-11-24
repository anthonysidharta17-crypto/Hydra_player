import { useEffect,useState } from 'react'
import { Menu,LogOut,X } from 'lucide-react'
import Logo from './Logo'
import Settings from '../screens/Settings'
import Home from '../screens/Home'
import Search from '../screens/Search'
import Browse from '../screens/Browse'
import Detail from '../screens/Detail'
import MyList from '../screens/MyList'
import Radio from '../screens/Radio'
import Catchup from '../screens/Catchup'
import Account from '../screens/Account'
import Support from '../screens/Support'
import WatchHistory from '../screens/WatchHistory'
import { ROUTES } from '../routes'
import { APP_VERSION } from '../config'
export default function Shell({session,route,param,navigate,prefs,updatePrefs,onLogout,onSwitchLogin,onForget}) {
  const [open,setOpen]=useState(false), current=ROUTES.find(r=>r.id===route)||ROUTES[0]
  const name=prefs.profileName||session.account.username
  useEffect(()=>{setOpen(false)},[route,param])
  useEffect(()=>{window.scrollTo(0,0)},[route,param])
  let screen
  switch(route) {
    case 'inicio': screen=<Home/>; break
    case 'pesquisar': screen=<Search/>; break
    case 'tv': screen=<Browse type="live"/>; break
    case 'radio': screen=<Radio/>; break
    case 'filmes': screen=param?<Detail key={param} type="movie" id={param}/>:<Browse type="movie"/>; break
    case 'series': screen=param?<Detail key={param} type="series" id={param}/>:<Browse type="series"/>; break
    case 'catchup': screen=<Catchup/>; break
    case 'historico': screen=<WatchHistory/>; break
    case 'minha-lista': screen=<MyList/>; break
    case 'conta': screen=<Account session={session} prefs={prefs} updatePrefs={updatePrefs}/>; break
    case 'ajuda': screen=<Support/>; break
    case 'configuracoes': screen=<Settings prefs={prefs} updatePrefs={updatePrefs} onLogout={onLogout} onSwitchLogin={onSwitchLogin} onForget={onForget}/>; break
    default: screen=<Home/>
  }
  return <div className="shell">
    <aside className={`sidebar${open?' open':''}`} aria-label="Menu principal">
      <div className="sidebar-top"><Logo compact/><button className="icon-btn only-small" onClick={()=>setOpen(false)} aria-label="Fechar menu"><X size={20}/></button></div>
      <nav>{ROUTES.map(({id,label,icon:Icon})=><button key={id} className={`nav-link${id===route?' active':''}`} aria-current={id===route?'page':undefined} onClick={()=>navigate(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <small className="sidebar-version">{APP_VERSION}</small>
    </aside>
    {open&&<div className="scrim" onClick={()=>setOpen(false)}/>}
    <div className="main"><header className="topbar"><button className="icon-btn only-small" onClick={()=>setOpen(true)} aria-label="Abrir menu"><Menu size={22}/></button><h1>{current.label}</h1><span className="spacer"/><span className="user-chip" title={name}>{name}</span><button className="btn-outline compact" onClick={onLogout}><LogOut size={16}/><span>Sair</span></button></header>
      <main className="content">{screen}</main>
    </div>
  </div>
}
