import { useState } from 'react'
import { LogOut, KeyRound, Trash2, Accessibility, ShieldCheck, Database, BookOpen } from 'lucide-react'
import { clearAppCache } from '../core/storage'
import { clearHistory } from '../core/history'
import { clearLastEpisodes, loadPrefs as loadPlayerPrefs, savePrefs as savePlayerPrefs } from '../core/playerPrefs'
import PrefsPanel from '../player/PrefsPanel'
import '../player/player.css'
function Row({icon:Icon,title,hint,children}) { return <div className="settings-row"><div className="settings-icon"><Icon size={18}/></div><div className="settings-text"><b>{title}</b><small>{hint}</small></div><div className="settings-action">{children}</div></div> }
export default function Settings({prefs,updatePrefs,onLogout,onSwitchLogin,onForget}) {
  const easy = prefs.mode==='easy', [notice,setNotice] = useState(''), [pp,setPp] = useState(loadPlayerPrefs), [tutorial,setTutorial] = useState(false)
  const setPlayerPref = patch => setPp(cur => { const next = { ...cur, ...patch }; savePlayerPrefs(next); return next })
  const resetWatch = () => { if (window.confirm('Apagar todo o histórico e a posição de reprodução deste aparelho?')) { clearHistory(); clearLastEpisodes(); setNotice('Histórico de reprodução apagado.') } }
  const cache = () => { clearAppCache(); setNotice('Cache temporário limpo. O catálogo será carregado novamente ao atualizar a tela.'); }
  return <div className="page-narrow"><h2 className="page-title">Configurações</h2><p className="page-sub">Personalize o aplicativo e controle os dados guardados neste aparelho.</p>
    <h3 className="group-label">APARÊNCIA E ACESSIBILIDADE</h3><section className="settings-card">
      <Row icon={Accessibility} title={easy?'Modo fácil ativado':'Modo completo'} hint="O modo fácil aumenta textos e botões."><button className={`switch${easy?' on':''}`} role="switch" aria-checked={easy} onClick={()=>updatePrefs({mode:easy?'full':'easy'})}><i/></button></Row>
    </section>
    <h3 className="group-label">APRENDER A USAR</h3><section className="settings-card">
      <Row icon={BookOpen} title="Tutorial do HYDRA" hint="Veja como navegar e usar os recursos do aplicativo."><button className="btn-outline" onClick={()=>setTutorial(v=>!v)}>{tutorial?'Fechar':'Abrir tutorial'}</button></Row>
      {tutorial && <div className="tutorial-content">
        <h3>Como usar o HYDRA</h3><ol>
          <li><b>Início:</b> veja os destaques e continue de onde parou.</li><li><b>TV ao vivo:</b> abra TV, escolha uma categoria e selecione o canal.</li>
          <li><b>Filmes:</b> navegue pelas categorias ou use a pesquisa; abra um título para ver detalhes e reproduzir.</li><li><b>Séries:</b> escolha uma série, temporada e episódio.</li>
          <li><b>Pesquisa:</b> use a lupa para localizar canais, filmes e séries.</li><li><b>Minha lista:</b> adicione títulos aos favoritos para encontrá-los depois.</li>
          <li><b>Histórico:</b> retome conteúdos reproduzidos recentemente.</li><li><b>Configurações:</b> ajuste aparência, acessibilidade e preferências do player.</li>
          <li><b>Ajuda Hydra:</b> teste a conexão, atualize o catálogo e consulte orientações sobre erros.</li></ol>
        <p>Se um conteúdo não abrir, teste outro título e confira sua conexão. Problemas de codec podem depender do aparelho ou do formato enviado pelo servidor.</p></div>}
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
