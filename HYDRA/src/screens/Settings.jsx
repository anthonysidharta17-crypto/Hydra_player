import { useState } from 'react'
import { LogOut, KeyRound, Trash2, Accessibility, ShieldCheck, Database } from 'lucide-react'
import { clearAppCache } from '../core/storage'
import { clearHistory } from '../core/history'
import { clearLastEpisodes, loadPrefs as loadPlayerPrefs, savePrefs as savePlayerPrefs } from '../core/playerPrefs'
import PrefsPanel from '../player/PrefsPanel'
import '../player/player.css'
function Row({icon:Icon,title,hint,children}) { return <div className="settings-row"><div className="settings-icon"><Icon size={18}/></div><div className="settings-text"><b>{title}</b><small>{hint}</small></div><div className="settings-action">{children}</div></div> }
export default function Settings({prefs,updatePrefs,onLogout,onSwitchLogin,onForget}) {
  const easy = prefs.mode==='easy', [notice,setNotice] = useState(''), [pp,setPp] = useState(loadPlayerPrefs)
  const setPlayerPref = patch => setPp(cur => { const next = { ...cur, ...patch }; savePlayerPrefs(next); return next })
  const resetWatch = () => { if (window.confirm('Apagar todo o histórico e a posição de reprodução deste aparelho?')) { clearHistory(); clearLastEpisodes(); setNotice('Histórico de reprodução apagado.') } }
  const cache = () => { clearAppCache(); setNotice('Cache temporário limpo. O catálogo será carregado novamente ao atualizar a tela.'); }
  return <div className="page-narrow"><h2 className="page-title">Configurações</h2><p className="page-sub">Personalize o aplicativo e controle os dados guardados neste aparelho.</p>
    <h3 className="group-label">APARÊNCIA E ACESSIBILIDADE</h3><section className="settings-card">
      <Row icon={Accessibility} title={easy?'Modo fácil ativado':'Modo completo'} hint="O modo fácil aumenta textos e botões."><button className={`switch${easy?' on':''}`} role="switch" aria-checked={easy} onClick={()=>updatePrefs({mode:easy?'full':'easy'})}><i/></button></Row>
    </section>
    <h3 className="group-label">REPRODUÇÃO</h3><section className="settings-card" style={{padding:'.4rem 1rem'}}>
      <PrefsPanel prefs={pp} onChange={setPlayerPref}/>
    </section>
    <h3 className="group-label">DADOS E PRIVACIDADE</h3><section className="settings-card">
      <Row icon={Database} title="Limpar cache de dados" hint="Apaga apenas dados temporários; não apaga seu acesso nem favoritos."><button className="btn-outline" onClick={cache}>Limpar</button></Row>
      <Row icon={Trash2} title="Apagar histórico" hint="Remove as posições salvas e o histórico de reprodução."><button className="btn-outline danger" onClick={resetWatch}>Apagar</button></Row>
      <Row icon={ShieldCheck} title="Dados de acesso" hint="Usuário e senha ficam salvos localmente apenas quando você escolhe manter o acesso."><span className="small-status">Armazenamento local</span></Row>
    </section>
    <h3 className="group-label">SUA CONTA</h3><section className="settings-card">
      <Row icon={LogOut} title="Sair" hint="Volta para a tela de login. Seu acesso continua salvo, mas não entra sozinho."><button className="btn-outline" onClick={onLogout}>Sair</button></Row>
      <Row icon={KeyRound} title="Trocar login" hint="Entrar com outro usuário e senha."><button className="btn-outline" onClick={onSwitchLogin}>Trocar</button></Row>
      <Row icon={Trash2} title="Esquecer acesso" hint="Apaga usuário e senha deste aparelho."><button className="btn-outline danger" onClick={()=>{if(window.confirm('Esquecer o acesso salvo neste aparelho?'))onForget()}}>Esquecer</button></Row>
    </section>
    {notice && <p className="hint-note" role="status">{notice}</p>}
  </div>
}
