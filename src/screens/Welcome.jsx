import { ArrowRight, UserPlus, LogIn, ShieldCheck } from 'lucide-react'
import Logo from '../components/Logo'
import { APP_NAME, APP_VERSION } from '../config'

export default function Welcome({ onLogin, onRegister }) {
  return <main className="login-screen"><div className="orb orb-a"/><div className="orb orb-b"/><section className="login-card" aria-label={`Bem-vindo ao ${APP_NAME}`}><div className="login-brand"><Logo/></div><header className="login-heading"><span className="eyebrow"><ShieldCheck size={13}/> BEM-VINDO AO HYDRA</span><h1>Seu entretenimento<br/><em>começa aqui.</em></h1><p>Escolha como deseja continuar.</p></header><div className="login-form"><button className="btn-primary big" type="button" onClick={onLogin}><LogIn size={18}/> Já tenho usuário e senha <ArrowRight size={18}/></button><button className="btn-secondary big" type="button" onClick={onRegister}><UserPlus size={18}/> Quero me cadastrar</button></div><footer className="login-foot"><span><ShieldCheck size={14}/> Acesso individual · liberação manual</span><small>{APP_NAME.toUpperCase()} · {APP_VERSION}</small></footer></section></main>
}
