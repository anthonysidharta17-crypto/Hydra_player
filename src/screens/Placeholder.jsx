import { Hammer } from 'lucide-react'

// Tela ainda não construída: mostra em qual etapa ela chega.
export default function Placeholder({ route, stage, children }) {
  const Icon = route.icon
  return (
    <div className="placeholder">
      <div className="placeholder-art"><Icon size={34} /></div>
      <h2>{route.label}</h2>
      <p>{children}</p>
      <span className="stage-pill"><Hammer size={13} /> Chega na etapa {stage}</span>
    </div>
  )
}
