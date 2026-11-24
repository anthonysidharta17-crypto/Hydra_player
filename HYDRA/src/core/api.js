import { xtreamApi } from './xtream'

export const callApi = (creds, action, params = {}, opts = {}) =>
  xtreamApi({ server: creds?.server, username: creds.username, password: creds.password, action, params, ...opts })
