import { SERVER } from '../config'
import { xtreamApi } from './xtream'

// Chamada ao player_api.php do servidor fixo do app.
export const callApi = (creds, action, params = {}, opts = {}) =>
  xtreamApi({ server: SERVER, username: creds.username, password: creds.password, action, params, ...opts })
