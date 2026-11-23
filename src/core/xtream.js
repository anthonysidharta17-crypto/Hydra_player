// Comunicação com o servidor Xtream Codes (player_api.php, xmltv.php, mídia).
const TIMEOUT_MS = 25000

export class HydraError extends Error {
  constructor(code, message) { super(message); this.code = code }
}

const trimSlash = s => String(s).trim().replace(/\/+$/, '')

export async function xtreamApi({ server, username, password, action, params = {}, signal, timeoutMs = TIMEOUT_MS }) {
  const url = new URL(`${trimSlash(server)}/player_api.php`)
  url.searchParams.set('username', username)
  url.searchParams.set('password', password)
  if (action) url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v))

  // Uma segunda tentativa só para falhas de rede passageiras.
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort('timeout'), timeoutMs)
    const abortOuter = () => ctrl.abort('outer')
    signal?.addEventListener('abort', abortOuter)
    try {
      const response = await fetch(url, { signal: ctrl.signal })
      if (!response.ok) throw new HydraError('http', `O servidor respondeu com erro (HTTP ${response.status}). Tente de novo em instantes.`)
      try { return await response.json() } catch {
        throw new HydraError('json', 'O servidor respondeu algo inesperado. Tente de novo em instantes.')
      }
    } catch (err) {
      if (err instanceof HydraError) throw err
      if (ctrl.signal.reason === 'outer') throw new HydraError('aborted', 'Operação cancelada.')
      if (ctrl.signal.reason === 'timeout') throw new HydraError('timeout', 'O servidor demorou demais para responder. Verifique sua internet e tente de novo.')
      if (attempt === 0) { await new Promise(r => setTimeout(r, 700)); continue }
      throw new HydraError('network', 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.')
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abortOuter)
    }
  }
}

// Valida usuário e senha. Devolve os dados da conta ou lança HydraError em português.
export async function xtreamLogin({ server, username, password, signal }) {
  const data = await xtreamApi({ server, username, password, signal })
  const info = data?.user_info
  const ok = info && (Number(info.auth) === 1 || info.auth === true)
  if (!ok) throw new HydraError('auth', 'Usuário ou senha incorretos. Confira os dados e tente de novo.')
  const status = String(info.status || '').toLowerCase()
  if (status === 'expired') throw new HydraError('expired', 'Esta assinatura expirou. Fale com quem forneceu seu acesso.')
  if (status === 'banned' || status === 'disabled') throw new HydraError('disabled', 'Este acesso está desativado. Fale com quem forneceu seu acesso.')
  return { account: normalizeAccount(data), serverInfo: data.server_info || {} }
}

// user_info → formato simples. exp = 0 significa sem data de expiração.
export function normalizeAccount(data) {
  const u = data?.user_info || {}
  const exp = Number(u.exp_date) || 0
  return {
    username: u.username || '',
    status: u.status || '',
    trial: String(u.is_trial) === '1',
    exp,
    daysLeft: exp ? Math.ceil((exp * 1000 - Date.now()) / 86400000) : null,
    activeConnections: Number(u.active_cons) || 0,
    maxConnections: Number(u.max_connections) || 0
  }
}

// ---- URLs de mídia (usadas na hora de tocar; nunca gravadas) ----
export function mediaUrl({ server, username, password }, kind, id, extension) {
  const folder = kind === 'live' ? 'live' : kind === 'movie' ? 'movie' : 'series'
  const ext = extension || (kind === 'live' ? 'ts' : 'mp4')
  return `${trimSlash(server)}/${folder}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${id}.${ext}`
}

export function xmltvUrl({ server, username, password }) {
  const url = new URL(`${trimSlash(server)}/xmltv.php`)
  url.searchParams.set('username', username)
  url.searchParams.set('password', password)
  return url.toString()
}

// Catch-up: start "AAAA-MM-DD HH:MM:SS" (hora do servidor), duração em minutos.
export function timeshiftUrl({ server, username, password }, streamId, start, minutes) {
  const stamp = String(start).slice(0, 16).replace(' ', ':').replace(/:(\d{2})$/, '-$1')
  return `${trimSlash(server)}/timeshift/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${minutes}/${stamp}/${streamId}.ts`
}
