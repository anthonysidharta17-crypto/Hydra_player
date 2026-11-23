import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, UserRound, ShieldCheck, ArrowRight, LoaderCircle, TriangleAlert } from 'lucide-react'
import Logo from '../components/Logo'
import { APP_NAME, APP_VERSION } from '../config'

export default function Login({ onLogin, fields, notice }) {
  const [username, setUsername] = useState(fields.username)
  const [password, setPassword] = useState(fields.password)
  const [remember, setRemember] = useState(fields.remember)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError('')
    if (!username.trim() || !password) {
      setError('Digite o usuário e a senha do seu acesso.')
      return
    }
    setBusy(true)
    try {
      await onLogin({ username: username.trim(), password, remember })
    } catch (err) {
      setError(err?.message || 'Não foi possível entrar. Tente de novo.')
      setBusy(false)
    }
  }

  const message = error || notice
  return (
    <main className="login-screen">
      <div className="orb orb-a" /><div className="orb orb-b" />
      <section className="login-card" aria-label={`Entrar no ${APP_NAME}`}>
        <div className="login-brand"><Logo /></div>
        <header className="login-heading">
          <span className="eyebrow"><ShieldCheck size={13} /> ACESSO DO CLIENTE</span>
          <h1>Seu entretenimento<br /><em>começa aqui.</em></h1>
          <p>Entre com o usuário e a senha do seu acesso.</p>
        </header>

        <form className="login-form" onSubmit={submit}>
          <label htmlFor="user">Usuário</label>
          <div className="field">
            <UserRound size={18} />
            <input id="user" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Digite seu usuário" autoComplete="username" autoCapitalize="none"
              autoCorrect="off" spellCheck={false} disabled={busy} autoFocus={!fields.username} />
          </div>

          <label htmlFor="pass">Senha</label>
          <div className="field">
            <LockKeyhole size={18} />
            <input id="pass" type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Digite sua senha"
              autoComplete="current-password" disabled={busy} />
            <button type="button" className="eye" onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <label className="remember">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} disabled={busy} />
            <span>Manter meu acesso salvo neste aparelho</span>
          </label>

          {message && <p className={`login-message${error ? ' error' : ''}`} role="alert"><TriangleAlert size={15} />{message}</p>}
          {busy && <p className="login-progress"><LoaderCircle size={16} className="spin" />Validando seu acesso…</p>}

          <button className="btn-primary big" type="submit" disabled={busy} autoFocus={!!fields.username}>
            {busy ? 'Conectando…' : 'Entrar no aplicativo'}{!busy && <ArrowRight size={18} />}
          </button>
        </form>

        <footer className="login-foot">
          <span><ShieldCheck size={14} /> Conteúdo autorizado · acesso individual</span>
          <small>{APP_NAME.toUpperCase()} · {APP_VERSION}</small>
        </footer>
      </section>
    </main>
  )
}
