import { useCallback, useEffect, useState } from 'react'
import { SERVER } from '../config'
import { xtreamLogin } from '../core/xtream'
import {
  loadCredentials, saveCredentials, forgetCredentials,
  loadLoginState, saveLoginState
} from '../core/storage'

const MIN_SPLASH_MS = 1100
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const initialFields = () => ({
  username: loadCredentials()?.username || '',
  password: loadCredentials()?.password || '',
  remember: loadLoginState().remember
})

// Estados: boot (splash) → login → ready.
// Regra de ouro: login e senha salvos só são apagados quando a pessoa pede.
// Nenhum erro (rede, senha recusada, assinatura vencida) apaga o acesso salvo.
export function useAuth() {
  const [phase, setPhase] = useState('boot')
  const [session, setSession] = useState(null)   // { creds, account }
  const [fields, setFields] = useState(initialFields)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    const saved = loadCredentials()
    const state = loadLoginState()
    ;(async () => {
      const started = Date.now()
      let result = null
      let error = ''
      if (saved && state.auto) {
        try { result = await xtreamLogin({ server: SERVER, ...saved }) }
        catch (err) { error = err.message }
      }
      const left = MIN_SPLASH_MS - (Date.now() - started)
      if (left > 0) await wait(left)
      if (cancelled) return
      if (result) {
        setSession({ creds: saved, account: result.account })
        setPhase('ready')
      } else {
        setNotice(error)
        setPhase('login')
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Lança erro em português se não conseguir entrar (a tela de login mostra a mensagem).
  const login = useCallback(async ({ username, password, remember }) => {
    const result = await xtreamLogin({ server: SERVER, username, password })
    if (remember) {
      saveCredentials({ username, password })
      saveLoginState({ remember: true, auto: true })
    } else {
      forgetCredentials()
      saveLoginState({ remember: false, auto: false })
    }
    setSession({ creds: { username, password }, account: result.account })
    setNotice('')
    setPhase('ready')
  }, [])

  // "Sair" NÃO apaga o acesso: os campos voltam preenchidos e o app só não entra sozinho.
  const logout = useCallback(() => {
    saveLoginState({ ...loadLoginState(), auto: false })
    setFields(initialFields())
    setSession(null)
    setNotice('')
    setPhase('login')
  }, [])

  // "Trocar login": abre o login vazio. O acesso antigo só é substituído se o novo funcionar.
  const switchLogin = useCallback(() => {
    saveLoginState({ ...loadLoginState(), auto: false })
    setFields({ username: '', password: '', remember: true })
    setSession(null)
    setNotice('')
    setPhase('login')
  }, [])

  // "Esquecer acesso": apaga login e senha deste aparelho.
  const forget = useCallback(() => {
    forgetCredentials()
    setFields({ username: '', password: '', remember: true })
    setSession(null)
    setNotice('Acesso esquecido neste aparelho.')
    setPhase('login')
  }, [])

  return { phase, session, fields, notice, login, logout, switchLogin, forget }
}
