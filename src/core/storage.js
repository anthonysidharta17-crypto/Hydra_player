// Tudo que fica gravado no aparelho (localStorage). Nunca grava URLs do Xtream,
// porque elas carregam usuário e senha.
const KEYS = {
  credentials: 'hydra.credentials', // { username, password }
  loginState: 'hydra.loginState',   // { remember, auto }
  prefs: 'hydra.prefs'
}

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}
const drop = key => { try { localStorage.removeItem(key) } catch { /* ignora */ } }

// ---- Acesso (login e senha) ----
// Só é apagado quando a pessoa pede (trocar ou esquecer). Erros de rede ou de
// validação NUNCA mexem nele.
export function loadCredentials() {
  const c = read(KEYS.credentials, null)
  return c?.username && c?.password ? { username: c.username, password: c.password } : null
}
export const saveCredentials = ({ username, password }) => write(KEYS.credentials, { username, password })
export const forgetCredentials = () => { drop(KEYS.credentials); drop(KEYS.loginState) }

// remember: a caixa "manter acesso salvo". auto: entrar sozinho ao abrir o app.
// "Sair" só desliga o auto: os campos voltam preenchidos, mas o app não entra sozinho.
export const loadLoginState = () => ({ remember: true, auto: false, ...read(KEYS.loginState, {}) })
export const saveLoginState = state => write(KEYS.loginState, state)

// ---- Preferências ----
export const DEFAULT_PREFS = {
  mode: 'full',            // full | easy
  audioPref: 'auto',       // auto | dublado | original
  subtitlesOn: false,
  subtitleSize: 'medium',  // small | medium | large
  resumeMode: 'ask',       // ask | always | never
  skipSeconds: 300,
  autoNext: true,
  profileName: '',
  externalPlayer: 'any'    // any | vlc | mx
}
export const loadPrefs = () => ({ ...DEFAULT_PREFS, ...read(KEYS.prefs, {}) })
export const savePrefs = prefs => write(KEYS.prefs, prefs)
