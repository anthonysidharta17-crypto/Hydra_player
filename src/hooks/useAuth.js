import { useCallback, useEffect, useState } from 'react'
import { SERVER } from '../config'
import { xtreamLogin } from '../core/xtream'
import { loadCredentials, saveCredentials, forgetCredentials, loadLoginState, saveLoginState } from '../core/storage'
import { loadRegistration, createRegistration, checkRegistration, clearRegistration } from '../core/registration'
const MIN_SPLASH_MS = 900
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const initialFields = () => ({ username: loadCredentials()?.username || '', password: loadCredentials()?.password || '', remember: loadLoginState().remember })
export function useAuth() {
  const [phase, setPhase] = useState('boot')
  const [session, setSession] = useState(null)
  const [fields, setFields] = useState(initialFields)
  const [notice, setNotice] = useState('')
  const [registration, setRegistration] = useState(loadRegistration)

  const acceptCredentials = useCallback(async credentials => {
    const result = await xtreamLogin({ server: SERVER, username: credentials.username, password: credentials.password })
    saveCredentials(credentials)
    saveLoginState({ remember: true, auto: true })
    clearRegistration()
    setRegistration(null)
    setSession({ creds: credentials, account: result.account, serverInfo: result.serverInfo })
    setNotice('')
    setPhase('ready')
    return result
  }, [])

  const refreshRegistration = useCallback(async () => {
    const current = registration || loadRegistration()
    if (!current) throw new Error('Nenhum cadastro encontrado neste aparelho.')
    const result = await checkRegistration(current)
    if (result.status === 'active' && result.credentials?.username && result.credentials?.password) {
      try { await acceptCredentials(result.credentials) }
      catch (error) { setNotice(`A administração liberou seu acesso, mas não foi possível validar no servidor: ${error.message}`) }
    } else if (result.status !== 'pending') {
      setNotice(`Situação do cadastro: ${result.status}. Entre em contato com a administração.`)
    } else setNotice('Seu perfil continua aguardando liberação.')
    return result
  }, [registration, acceptCredentials])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const started = Date.now(), saved = loadCredentials(), state = loadLoginState(), pending = loadRegistration()
      let result = null, error = ''
      if (saved && state.auto) { try { result = await xtreamLogin({ server: SERVER, ...saved }) } catch (err) { error = err.message } }
      const left = MIN_SPLASH_MS - (Date.now() - started); if (left > 0) await wait(left)
      if (cancelled) return
      if (result) { setSession({ creds: saved, account: result.account, serverInfo: result.serverInfo }); setPhase('ready') }
      else if (saved) { setNotice(error); setPhase('login') }
      else if (pending) { setRegistration(pending); setPhase('pending') }
      else setPhase('request')
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (phase !== 'pending' || !registration) return
    const timer = setInterval(() => { refreshRegistration().catch(err => setNotice(err.message)) }, 15000)
    return () => clearInterval(timer)
  }, [phase, registration, refreshRegistration])

  const requestAccess = useCallback(async details => {
    const created = await createRegistration(details)
    setRegistration(created); setNotice(''); setPhase('pending')
  }, [])
  const login = useCallback(async ({ username, password, remember }) => {
    const result = await xtreamLogin({ server: SERVER, username, password })
    if (remember) { saveCredentials({ username, password }); saveLoginState({ remember: true, auto: true }) }
    else { forgetCredentials(); saveLoginState({ remember: false, auto: false }) }
    clearRegistration(); setRegistration(null)
    setSession({ creds: { username, password }, account: result.account, serverInfo: result.serverInfo })
    setNotice(''); setPhase('ready')
  }, [])
  const logout = useCallback(() => { saveLoginState({ ...loadLoginState(), auto: false }); setFields(initialFields()); setSession(null); setNotice(''); setPhase('login') }, [])
  const switchLogin = useCallback(() => { saveLoginState({ ...loadLoginState(), auto: false }); setFields({ username: '', password: '', remember: true }); setSession(null); setNotice(''); setPhase('login') }, [])
  const forget = useCallback(() => { forgetCredentials(); clearRegistration(); setRegistration(null); setFields({ username: '', password: '', remember: true }); setSession(null); setNotice('Acesso esquecido neste aparelho.'); setPhase('request') }, [])
  const resetRegistration = useCallback(() => { clearRegistration(); setRegistration(null); setNotice(''); setPhase('request') }, [])
  const showRequest = useCallback(() => { setNotice(''); setPhase('request') }, [])
  return { phase, session, fields, notice, registration, login, logout, switchLogin, forget, requestAccess, refreshRegistration, resetRegistration, showRequest }
}
