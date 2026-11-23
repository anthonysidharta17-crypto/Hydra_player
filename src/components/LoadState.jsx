import { LoaderCircle, TriangleAlert } from 'lucide-react'

export default function LoadState({ text = 'Carregando…', error, onRetry }) {
  if (error) {
    return (
      <div className="load-state error" role="alert">
        <TriangleAlert size={26} />
        <p>{error}</p>
        {onRetry && <button className="btn-primary" onClick={onRetry}>Tentar de novo</button>}
      </div>
    )
  }
  return <div className="load-state" role="status"><LoaderCircle className="spin" size={26} /><p>{text}</p></div>
}
