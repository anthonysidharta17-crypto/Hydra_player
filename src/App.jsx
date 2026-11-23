import { useEffect, useState } from 'react'
import Splash from './components/Splash'
import Shell from './components/Shell'
import Login from './screens/Login'
import AccessRequest from './screens/AccessRequest'
import PendingAccess from './screens/PendingAccess'
import { AppProvider, useApp } from './context/AppContext'
import { useAuth } from './hooks/useAuth'
import { usePrefs } from './hooks/usePrefs'
import { useRoute } from './hooks/useRoute'
import { useDpad } from './hooks/useDpad'
import { useBackButton } from './hooks/useBackButton'
import ExitConfirm from './components/ExitConfirm'
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
  const [exitOpen, setExitOpen] = useState(false)
  useDpad()
  useBackButton({ route, param, phase: auth.phase, navigate, exitOpen, setExitOpen })
  let content
  if (auth.phase === 'boot') content = <Splash message="Verificando seu acesso…" />
  else if (auth.phase === 'request') content = <AccessRequest onRequest={auth.requestAccess} notice={auth.notice} />
  else if (auth.phase === 'pending') content = <PendingAccess registration={auth.registration} onRefresh={auth.refreshRegistration} onReset={auth.resetRegistration} notice={auth.notice} />
  else if (auth.phase === 'login') content = <Login onLogin={auth.login} onRegister={auth.showRequest} fields={auth.fields} notice={auth.notice} />
  else content = <AppProvider creds={auth.session.creds} navigate={navigate}>
    <StartupGate><Shell session={auth.session} route={route} param={param} navigate={navigate} prefs={prefs} updatePrefs={updatePrefs}
      onLogout={auth.logout} onSwitchLogin={auth.switchLogin} onForget={auth.forget} /></StartupGate>
  </AppProvider>
  return <>{content}{exitOpen && <ExitConfirm onStay={() => setExitOpen(false)} />}</>
}
