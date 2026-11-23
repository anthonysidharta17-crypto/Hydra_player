import { useEffect, useState } from 'react'
import Splash from './components/Splash'
import Shell from './components/Shell'
import Login from './screens/Login'
import { AppProvider, useApp } from './context/AppContext'
import { useAuth } from './hooks/useAuth'
import { usePrefs } from './hooks/usePrefs'
import { useRoute } from './hooks/useRoute'
import { useDpad } from './hooks/useDpad'
function StartupGate({ children }) {
  const { status } = useApp()
  const [limit, setLimit] = useState(false)
  useEffect(() => { const id = setTimeout(() => setLimit(true), 4800); return () => clearTimeout(id) }, [])
  const finished = ['live', 'movie', 'series'].filter(t => status[t] !== 'loading').length
  if (finished < 3 && !limit) return <Splash message={`Preparando seu catálogo… ${finished}/3 etapas concluídas`} />
  return children
}
export default function App() {
  const auth = useAuth()
  const { prefs, updatePrefs } = usePrefs()
  const { route, param, navigate } = useRoute()
  useDpad()
  if (auth.phase === 'boot') return <Splash message="Verificando seu acesso…" />
  if (auth.phase === 'login') return <Login onLogin={auth.login} fields={auth.fields} notice={auth.notice} />
  return <AppProvider creds={auth.session.creds} navigate={navigate}>
    <StartupGate><Shell session={auth.session} route={route} param={param} navigate={navigate} prefs={prefs} updatePrefs={updatePrefs}
      onLogout={auth.logout} onSwitchLogin={auth.switchLogin} onForget={auth.forget} /></StartupGate>
  </AppProvider>
}
