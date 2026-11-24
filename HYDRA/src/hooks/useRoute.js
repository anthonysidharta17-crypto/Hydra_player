import { useCallback, useEffect, useState } from 'react'
import { ROUTES } from '../routes'
function read() {
  const [id, ...rest] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { route: ROUTES.some(r => r.id === id) ? id : 'inicio', param: rest.length ? decodeURIComponent(rest.join('/')) : '' }
}
export function useRoute() {
  const [state, setState] = useState(read)
  useEffect(() => { const onChange = () => setState(read()); window.addEventListener('hashchange', onChange); return () => window.removeEventListener('hashchange', onChange) }, [])
  const navigate = useCallback((id, param = '') => { window.location.hash = param ? `/${id}/${encodeURIComponent(param)}` : `/${id}` }, [])
  return { ...state, navigate }
}
