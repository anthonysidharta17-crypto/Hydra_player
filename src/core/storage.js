const KEYS = { credentials: 'hydra.credentials', loginState: 'hydra.loginState', prefs: 'hydra.prefs' }
const read = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback } }
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false } }
const drop = key => { try { localStorage.removeItem(key) } catch {} }
export function loadCredentials() { const c = read(KEYS.credentials, null); return c?.username && c?.password ? { username: c.username, password: c.password } : null }
export const saveCredentials = ({ username, password }) => write(KEYS.credentials, { username, password })
export const forgetCredentials = () => { drop(KEYS.credentials); drop(KEYS.loginState) }
export const loadLoginState = () => ({ remember: true, auto: false, ...read(KEYS.loginState, {}) })
export const saveLoginState = state => write(KEYS.loginState, state)
export const DEFAULT_PREFS = { mode: 'full', audioPref: 'auto', subtitlesOn: false, subtitleSize: 'medium', resumeMode: 'ask', skipSeconds: 300, autoNext: true, profileName: '', externalPlayer: 'any' }
export const loadPrefs = () => ({ ...DEFAULT_PREFS, ...read(KEYS.prefs, {}) })
export const savePrefs = prefs => write(KEYS.prefs, prefs)
export function clearAppCache() {
  for (const key of Object.keys(localStorage)) if (key.startsWith('hydra.cache.') || key.startsWith('hydra.metadata.')) drop(key)
}
