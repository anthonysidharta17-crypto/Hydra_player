import { useCallback, useEffect, useState } from 'react'
import { SERVER, CONTROL_API } from '../config'
import { xtreamLogin } from '../core/xtream'
import { loadCredentials, saveCredentials, forgetCredentials, loadLoginState, saveLoginState } from '../core/storage'
import { loadRegistration, createRegistration, checkRegistration, clearRegistration } from '../core/registration'
const MIN_SPLASH_MS = 900
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const API = (CONTROL_API || '').replace(/\/+$/, '')
const APP_LOGIN_KEY = 'hydra_app_login'
const loadAppLogin = () => { try { return localStorage.getItem(APP_LOGIN_KEY) || '' } catch { return '' } }
const saveAppLogin = value => { try { localStorage.setItem(APP_LOGIN_KEY, value) } catch {} }
const forgetAppLogin = () => { try { localStorage.removeItem(APP_LOGIN_KEY) } catch {} }
const initialFields = () => ({ username: loadAppLogin(), password: '', remember: loadLoginState().remember })

async function appLogin(app_user, app_password) {
  if (!API) throw new Error('O serviço de acesso ainda não foi configurado neste aplicativo.')
  let res
  try {
    res = await fetch(API + '/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ app_user, app_password }),
    })
  } catch { throw new Error('Sem conexão com o servidor. Verifique sua internet.') }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Não foi possível entrar.')
  return data
}

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
      else setPhase('welcome')
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
    if (details.app_user) saveAppLogin(details.app_user)
    setRegistration(created); setNotice(''); setPhase('pending')
  }, [])

  const login = useCallback(async ({ username, password, remember }) => {
    const user = username.trim().toLowerCase()
    const data = await appLogin(user, password)
    if (data.status === 'pending') throw new Error('Seu cadastro ainda está aguardando liberação da administração.')
    if (data.status !== 'active' || !data.credentials?.username || !data.credentials?.password)
      throw new Error('Seu acesso não está liberado. Fale com a administração.')
    const x = { username: data.credentials.username, password: data.credentials.password }
    let result
    try { result = await xtreamLogin({ server: SERVER, username: x.username, password: x.password }) }
    catch (error) { throw new Error(`Seu acesso foi liberado, mas não foi possível validar no servidor: ${error.message}`) }
    if (remember) { saveCredentials(x); saveLoginState({ remember: true, auto: true }); saveAppLogin(user) }
    else { forgetCredentials(); forgetAppLogin(); saveLoginState({ remember: false, auto: false }) }
    clearRegistration(); setRegistration(null)
    setSession({ creds: x, account: result.account, serverInfo: result.serverInfo })
    setNotice(''); setPhase('ready')
  }, [])

  const logout = useCallback(() => { saveLoginState({ ...loadLoginState(), auto: false }); setFields(initialFields()); setSession(null); setNotice(''); setPhase('login') }, [])
  const switchLogin = useCallback(() => { saveLoginState({ ...loadLoginState(), auto: false }); setFields({ username: '', password: '', remember: true }); setSession(null); setNotice(''); setPhase('login') }, [])
  const forget = useCallback(() => { forgetCredentials(); forgetAppLogin(); clearRegistration(); setRegistration(null); setFields({ username: '', password: '', remember: true }); setSession(null); setNotice('Acesso esquecido neste aparelho.'); setPhase('welcome') }, [])
  const resetRegistration = useCallback(() => { clearRegistration(); setRegistration(null); setNotice(''); setPhase('welcome') }, [])
  const showRequest = useCallback(() => { setNotice(''); setPhase('request') }, [])
  const showLogin = useCallback(() => { setNotice(''); setFields(initialFields()); setPhase('login') }, [])
  return { phase, session, fields, notice, registration, login, logout, switchLogin, forget, requestAccess, refreshRegistration, resetRegistration, showRequest, showLogin }
}