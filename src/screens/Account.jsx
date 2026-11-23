import { useState } from 'react'
import { CalendarClock, CircleCheck, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { SERVER } from '../config'
import { useApp } from '../context/AppContext'
import { xtreamApi, normalizeAccount } from '../core/xtream'
export default function Account({session,prefs,updatePrefs}) {
  const { creds, showToast } = useApp()
  const [fresh,setFresh] = useState(null), [busy,setBusy] = useState(false)
  const a=fresh||session?.account||{}, exp=a.exp?new Date(a.exp*1000):null
  const active=String(a.status||'').toLowerCase()==='active'
  const date=exp?exp.toLocaleDateString('pt-BR'):'Sem data informada'
  // Atualiza só a tela; erro de rede nunca mexe no acesso salvo.
  const refresh = async () => {
    setBusy(true)
    try {
      const data = await xtreamApi({ server: SERVER, username: creds.username, password: creds.password })
      if (!data?.user_info) throw new Error('sem dados')
      setFresh(normalizeAccount(data)); showToast('Dados da conta atualizados.')
    } catch { showToast('Não foi possível atualizar agora. Tente de novo em instantes.') }
    finally { setBusy(false) }
  }
  return <div className="page-narrow"><div className="page-heading"><div><h2 className="page-title">Minha conta</h2><p className="page-sub">Informações que o servidor Xtream disponibilizou para seu acesso.</p></div><button className="btn-outline" disabled={busy} onClick={refresh}><RefreshCw size={15}/> {busy?'Atualizando…':'Atualizar'}</button></div>
    <section className="account-card"><div className="account-avatar"><ShieldCheck size={30}/></div><div><small>USUÁRIO</small><h3>{a.username||creds?.username||'Cliente'}</h3><span className={`account-status ${active?'ok':'warn'}`}>{a.status||'Status não informado'}</span></div></section>
    <section className="account-grid">
      <div className="account-stat"><CalendarClock size={19}/><small>Expiração</small><b>{date}</b>{a.daysLeft!==null&&a.daysLeft!==undefined&&<span>{a.daysLeft<0?'Expirado':`${a.daysLeft} dias restantes`}</span>}</div>
      <div className="account-stat"><Users size={19}/><small>Conexões em uso</small><b>{a.activeConnections??0} / {a.maxConnections||'—'}</b><span>{a.trial?'Acesso de teste':'Acesso regular'}</span></div>
      <div className="account-stat"><CircleCheck size={19}/><small>Condição do acesso</small><b>{active?'Ativo':a.status||'Não confirmado'}</b><span>{a.trial?'Período de teste':'Conta Xtream'}</span></div>
    </section>
    <label className="form-label" htmlFor="profile-name">Nome neste aparelho</label>
    <input id="profile-name" className="app-input" maxLength={24} value={prefs?.profileName||''} onChange={e=>updatePrefs?.({profileName:e.target.value})} placeholder={a.username||'Seu nome'}/>
    <p className="hint-note">Apenas o servidor que fornece seu acesso pode alterar status, validade, número de conexões e disponibilidade do conteúdo.</p>
  </div>
}
