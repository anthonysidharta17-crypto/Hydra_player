import { Hammer } from 'lucide-react'
export default function Placeholder({ route, children }) {
  const Icon = route.icon
  return <div className="placeholder"><div className="placeholder-art"><Icon size={34}/></div><h2>{route.label}</h2><p>{children}</p><span className="stage-pill"><Hammer size={13}/> Recurso indisponível</span></div>
}
