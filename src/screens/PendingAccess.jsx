import { useState, useRef } from 'react'
import { Clock3, RefreshCw, ShieldCheck, TriangleAlert, LogOut } from 'lucide-react'
import Logo from '../components/Logo'
import AdminPanel from '../AdminPanel'
import { APP_NAME, APP_VERSION } from '../config'
export default function PendingAccess({ registration, onRefresh, onReset, notice = '' }) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(notice || 'Seu perfil está aguardando liberação da administração.')
  const [showAdmin,setShowAdmin]=useState(false)
  const taps=useRef({n:0,t:0})
  function secretTap(){const now=Date.now();taps.current.n=now-taps.current.t<1500?taps.current.n+1:1;taps.current.t=now;if(taps.current.n>=5){taps.current.n=0;setShowAdmin(true)}}
  async function refresh(){if(busy)return;setBusy(true);setMessage('Consultando sua liberação…');try{const result=await onRefresh();setMessage(result?.status==='pending'?'Seu perfil continua aguardando liberação.':'Verificação concluída.')}catch(e){setMessage(e.message||'Não foi possível consultar agora.')}finally{setBusy(false)}}
  return <main className="login-screen"><div className="orb orb-a"/><section className="login-card"><div className="login-brand" onClick={secretTap}><Logo/></div><header className="login-heading"><span className="eyebrow"><Clock3 size={13}/> PERFIL EM ANÁLISE</span><h1>Aguardando<br/><em>liberação.</em></h1><p>Seu cadastro foi recebido. Assim que a administração inserir seu usuário e senha, o acesso será liberado automaticamente nesta TV.</p></header><div className="pending-profile"><b>{registration?.name||'Cliente Hydra'}</b><span>{registration?.contact||''}</span><strong>AGUARDANDO LIBERAÇÃO</strong></div>{message&&<p className="login-message"><TriangleAlert size={15}/>{message}</p>}<div className="login-form"><button className="btn-primary big" onClick={refresh} disabled={busy}>{busy?'Verificando…':'Verificar liberação'}<RefreshCw size={17}/></button><button className="btn-secondary big" onClick={onReset} disabled={busy}><LogOut size={16}/> Voltar / trocar cadastro</button></div><footer className="login-foot"><span><ShieldCheck size={14}/> Seu perfil fica vinculado a este aparelho</span><small onClick={secretTap}>{APP_NAME.toUpperCase()} · {APP_VERSION}</small></footer></section>{showAdmin&&<AdminPanel onClose={()=>setShowAdmin(false)}/>}</main>
}