import { useMemo, useState } from 'react'
import { Bot, Send, Wifi, RefreshCw, Database, CircleHelp, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { detectDevice, describeDevice } from '../player/ai'
import { clearAppCache } from '../core/storage'
const QUICK=["O vídeo não reproduz","O catálogo não carrega","O vídeo fica travando","Não aparece imagem, só áudio"]
function answerFor(question,status,online) {
  const q=question.toLowerCase()
  if(/sinopse|descri[cç][aã]o|filme|s[eé]rie/.test(q)) return 'Quando o provedor não envia uma sinopse, o Hydra tenta localizar uma descrição correspondente na Wikipédia em português e mostra a fonte. Se não houver correspondência confiável, não inventa uma sinopse.'
  if(/expir|senha|login|acesso|usu[aá]rio/.test(q)) return 'O login é validado diretamente no servidor configurado. Confira usuário e senha com quem forneceu seu acesso. Não compartilhe sua senha aqui; erros de conexão não apagam o acesso salvo.'
  if(/trav|buffer|carreg|demor/.test(q)) return `Diagnóstico: internet ${online?'conectada no aparelho':'sem conexão detectada'}. Catálogo: TV ${status.live}, filmes ${status.movie}, séries ${status.series}. Teste outra rede, feche reproduções em outros aparelhos e atualize o catálogo.`
  if(/imagem|preto|tela|h.?265|hevc|codec|[áa]udio/.test(q)) return 'Quando há áudio sem imagem, a causa provável é um codec de vídeo incompatível (por exemplo, HEVC/H.265) ou um stream com falha. O Hydra tenta formatos alternativos; teste outro conteúdo e, se persistir, use um player externo compatível.'
  if(/cat[aá]logo|canal|filme|s[eé]rie|lista/.test(q)) return 'Vou conferir o estado do catálogo. Use “Atualizar catálogo” abaixo. Se continuar vazio, o servidor pode estar sem resposta ou não disponibilizar aquela categoria.'
  if(/catch.?up|grava|programa/.test(q)) return 'O Catch-up depende de o seu provedor habilitar TV Archive e entregar os dados de gravação/EPG. Se o canal não aparecer na lista, esse recurso não está liberado para ele.'
  if(/r[aá]dio/.test(q)) return 'A seção Rádio filtra os canais cujo nome ou categoria indicam rádio, FM, música ou estações. O servidor precisa incluir essas estações no catálogo.'
  return 'Posso verificar rede, estado do catálogo e compatibilidade do aparelho, além de orientar sobre reprodução, login, rádio e Catch-up. Conte qual tela você estava usando e qual mensagem apareceu — sem enviar senha ou endereço privado do stream.'
}
export default function Support() {
  const {status,reloadAll,showToast} = useApp(), [input,setInput]=useState(''),[messages,setMessages]=useState([{by:'bot',text:'Olá! Sou o suporte Hydra. Posso fazer verificações locais e orientar os próximos passos. Não consigo corrigir uma queda do servidor do provedor nem validar conteúdo que ele não disponibiliza.'}])
  const online=typeof navigator!=='undefined'?navigator.onLine:false
  const device=useMemo(()=>{try{return detectDevice()}catch{return null}},[])
  const add=(q)=>{const text=q.trim();if(!text)return;setMessages(m=>[...m,{by:'user',text},{by:'bot',text:answerFor(text,status,online)}]);setInput('')}
  const diagnostics=()=>{const lines=[`Internet: ${online?'conexão detectada':'sem conexão detectada'}`,`Catálogo: TV ${status.live}, filmes ${status.movie}, séries ${status.series}`,...(device?describeDevice(device).slice(0,6).map(([k,v])=>`${k}: ${v}`):[])];setMessages(m=>[...m,{by:'bot',text:`Diagnóstico local (não inclui usuário, senha ou URLs):\n${lines.join('\n')}`}])}
  const refresh=()=>{reloadAll();setMessages(m=>[...m,{by:'bot',text:'Atualizei os pedidos de TV, filmes e séries. Aguarde um pouco e volte a consultar o catálogo.'}]);showToast('Atualizando catálogo…')}
  const cache=()=>{clearAppCache();showToast('Cache temporário limpo.')}
  return <div className="support-page"><header className="support-head"><div className="support-avatar"><Bot size={25}/></div><div><h2>Hydra Ajuda</h2><small><span className="online-dot"/> Diagnóstico automático no aparelho</small></div></header>
    <div className="support-tools"><button className="support-tool" onClick={diagnostics}><Wifi size={17}/> Testar conexão</button><button className="support-tool" onClick={refresh}><RefreshCw size={17}/> Atualizar catálogo</button><button className="support-tool" onClick={cache}><Database size={17}/> Limpar cache</button></div>
    <div className="chat-log" aria-live="polite">{messages.map((m,i)=><div key={i} className={`chat-msg ${m.by}`}><span>{m.by==='bot'?'HYDRA':'VOCÊ'}</span><p>{m.text}</p></div>)}</div>
    <div className="quick-questions">{QUICK.map(q=><button key={q} onClick={()=>add(q)}>{q}</button>)}</div>
    <form className="chat-compose" onSubmit={e=>{e.preventDefault();add(input)}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Descreva o que aconteceu…" aria-label="Mensagem para o suporte"/><button className="btn-primary" type="submit" disabled={!input.trim()} aria-label="Enviar mensagem"><Send size={18}/></button></form>
    <p className="support-privacy"><ShieldCheck size={14}/> Não envie senha, links privados ou dados de acesso no chat. O diagnóstico não transmite logs pessoais.</p>
  </div>
}
