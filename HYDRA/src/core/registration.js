import { CONTROL_API } from '../config'
const KEY = 'hydra.registration'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null } }
export const loadRegistration = read
export const saveRegistration = value => { try { localStorage.setItem(KEY, JSON.stringify(value)); return true } catch { return false } }
export const clearRegistration = () => { try { localStorage.removeItem(KEY) } catch {} }
async function request(path, options = {}) {
  if (!CONTROL_API) throw new Error('O serviço de cadastro ainda não foi configurado neste aplicativo.')
  const response = await fetch(`${CONTROL_API.replace(/\/$/, '')}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Falha de comunicação (${response.status}).`)
  return data
}
export async function createRegistration({ name, contact }) {
  const data = await request('/api/register', { method: 'POST', body: JSON.stringify({ name, contact }) })
  const registration = { id: data.id, token: data.token, name, contact }
  saveRegistration(registration)
  return registration
}
export async function checkRegistration(registration) {
  return request(`/api/access/${encodeURIComponent(registration.id)}`, { headers: { authorization: `Bearer ${registration.token}` } })
}

export async function resolveClientLogin({ username, password }) {
  const data = await request('/api/client/login', { method: 'POST', body: JSON.stringify({ username, password }) })
  if (!data.credentials?.server) throw new Error('A administração ainda não associou um servidor a este acesso.')
  return data.credentials
}
