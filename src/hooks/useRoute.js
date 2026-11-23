import { useCallback, useEffect, useState } from 'react'
import { ROUTES } from '../routes'

// Rotas por hash: #/filmes ou #/filmes/movie-123 (tela + item). Funcionam no APK
// e o botão "voltar" do Android funciona sem configuração extra.
function read() {
  const [id, ...rest] = window.location.hash.replace(/^#\/?/, '').split('/')
  const route = ROUTES.some(r => r.id === id) ? id : 'inicio'
  const param = rest.length ? decodeURIComponent(rest.join('/')) : ''
  return { route, param }
}

export function useRoute() {
  const [state, setState] = useState(read)
  useEffect(() => {
    const onChange = () => setState(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = useCallback((id, param = '') => {
    window.location.hash = param ? `/${id}/${encodeURIComponent(param)}` : `/${id}`
  }, [])
  return { ...state, navigate }
}
