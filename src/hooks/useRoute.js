import { useCallback, useEffect, useState } from 'react'
import { ROUTES } from '../routes'

// Rotas por hash (#/filmes): funcionam no GitHub Pages e no APK, e o botão
// "voltar" do Android funciona sem configuração extra.
const read = () => {
  const id = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return ROUTES.some(route => route.id === id) ? id : 'inicio'
}

export function useRoute() {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = useCallback(id => { window.location.hash = `/${id}` }, [])
  return { route, navigate }
}
