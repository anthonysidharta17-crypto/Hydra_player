import { exitApp } from '../hooks/useBackButton'
export default function ExitConfirm({ onStay }) {
  return <div className="exit-scrim" role="dialog" aria-modal="true" aria-labelledby="exit-title">
    <div className="exit-box"><h3 id="exit-title">Quer sair do app?</h3><p>Seu acesso continua salvo neste aparelho.</p>
      <div className="exit-actions"><button className="btn-outline" autoFocus onClick={onStay}>Ficar</button><button className="btn-primary" onClick={exitApp}>Sair</button></div></div>
  </div>
}
