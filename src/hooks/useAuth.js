import { useCallback, useEffect, useState } from 'react'
import { SERVER } from '../config'
import { xtreamLogin } from '../core/xtream'
import { loadCredentials, saveCredentials, forgetCredentials, loadLoginState, saveLoginState } from '../core/storage'
const MIN_SPLASH_MS = 900
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const initialFields = () => ({ username: loadCredentials()?.username || '', password: loadCredentials()?.password || '', remember: loadLoginState().remember })
export function useAuth() {
  const [phase, setPhase] = useState('boot')
  const [session, setSession] = useState(null)
  const [fields, setFields] = useState(initialFields)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let cancelled = false
    const saved = loadCredentials(), state = loadLoginState()
    ;(async () => {
      const started = Date.now(); let result = null, error = ''
      if (saved && state.auto) { try { result = await xtreamLogin({ server: SERVER, ...saved }) } catch (err) { error = err.message } }
      const left = MIN_SPLASH_MS - (Date.now() - started); if (left > 0) await wait(left)
      if (cancelled) return
      if (result) { setSession({ creds: saved, account: result.account, serverInfo: result.serverInfo }); setPhase('ready') }
      else { setNotice(error); setPhase('login') }
    })()
    return () => { cancelled = true }
  }, [])
  const login = useCallback(async ({ username, password, remember }) => {
    const result = await xtreamLogin({ server: SERVER, username, password })
    if (remember) { saveCredentials({ username, password }); saveLoginState({ remember: true, auto: true }) }
    else { forgetCredentials(); saveLoginState({ remember: false, auto: false }) }
    setSession({ creds: { username, password }, account: result.account, serverInfo: result.serverInfo })
    setNotice(''); setPhase('ready')
  }, [])
  const logout = useCallback(() => { saveLoginState({ ...loadLoginState(), auto: false }); setFields(initialFields()); setSession(null); setNotice(''); setPhase('login') }, [])
  const switchLogin = useCallback(() => { saveLoginState({ ...loadLoginState(), auto: false }); setFields({ username: '', password: '', remember: true }); setSession(null); setNotice(''); setPhase('login') }, [])
  const forget = useCallback(() => { forgetCredentials(); setFields({ username: '', password: '', remember: true }); setSession(null); setNotice('Acesso esquecido neste aparelho.'); setPhase('login') }, [])
  return { phase, session, fields, notice, login, logout, switchLogin, forget }
}
