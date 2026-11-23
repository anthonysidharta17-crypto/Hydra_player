import { useEffect, useRef } from 'react'
// Botão Voltar do Android (também o do controle da TV):
//  - player aberto: fecha o player
//  - confirmação aberta: fica no app
//  - em outra tela: volta para a página anterior
//  - na tela Início ou no login: pergunta se quer sair
export function useBackButton(state) {
  const ref = useRef(state)
  ref.current = state
  useEffect(() => {
    let handle = null
    let dead = false
    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', () => {
        const { route, param, phase, navigate, exitOpen, setExitOpen } = ref.current
        if (exitOpen) { setExitOpen(false); return }
        if (history.state && history.state.hydraPlayer) { history.back(); return }
        if (phase === 'ready' && (route !== 'inicio' || param)) {
          if (window.history.length > 1) history.back(); else navigate('inicio')
          return
        }
        setExitOpen(true)
      }).then(h => { if (dead) h.remove(); else handle = h }).catch(() => {})
    }).catch(() => {})
    return () => { dead = true; handle?.remove?.() }
  }, [])
}
export function exitApp() {
  import('@capacitor/app').then(({ App }) => App.exitApp()).catch(() => { try { window.close() } catch { /* ignora */ } })
}
