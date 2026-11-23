import { LogOut, KeyRound, Trash2, Accessibility } from 'lucide-react'

function Row({ icon: Icon, title, hint, children }) {
  return (
    <div className="settings-row">
      <div className="settings-icon"><Icon size={18} /></div>
      <div className="settings-text"><b>{title}</b><small>{hint}</small></div>
      <div className="settings-action">{children}</div>
    </div>
  )
}

export default function Settings({ prefs, updatePrefs, onLogout, onSwitchLogin, onForget }) {
  const easy = prefs.mode === 'easy'
  return (
    <div className="page-narrow">
      <h2 className="page-title">Configurações</h2>
      <p className="page-sub">As demais opções (áudio, legenda, retomar, salto e diagnóstico) chegam junto com o player, na etapa 3.</p>

      <h3 className="group-label">APARÊNCIA</h3>
      <section className="settings-card">
        <Row icon={Accessibility} title={easy ? 'Modo fácil' : 'Modo completo'}
          hint="O modo fácil deixa textos e botões maiores.">
          <button className={`switch${easy ? ' on' : ''}`} role="switch" aria-checked={easy}
            onClick={() => updatePrefs({ mode: easy ? 'full' : 'easy' })}><i /></button>
        </Row>
      </section>

      <h3 className="group-label">ACESSO</h3>
      <section className="settings-card">
        <Row icon={LogOut} title="Sair" hint="Volta para a tela de login. Seu acesso continua salvo, só não entra sozinho.">
          <button className="btn-outline" onClick={onLogout}>Sair</button>
        </Row>
        <Row icon={KeyRound} title="Trocar login" hint="Entrar com outro usuário e senha. O acesso atual só é substituído se o novo funcionar.">
          <button className="btn-outline" onClick={onSwitchLogin}>Trocar</button>
        </Row>
        <Row icon={Trash2} title="Esquecer acesso" hint="Apaga usuário e senha deste aparelho.">
          <button className="btn-outline danger" onClick={() => { if (window.confirm('Esquecer o acesso salvo neste aparelho?')) onForget() }}>Esquecer</button>
        </Row>
      </section>
    </div>
  )
}
