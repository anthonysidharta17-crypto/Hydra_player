import { SERVER } from '../config'
import { xtreamApi } from './xtream'

export const callApi = (creds, action, params = {}, opts = {}) =>
  xtreamApi({ server: SERVER, username: creds.username, password: creds.password, action, params, ...opts })
