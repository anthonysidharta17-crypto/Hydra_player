export default function Logo({ compact = false }) {
  return <div className={`logo-lockup${compact ? ' compact' : ''}`}>
    <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" />
    <div><strong>HYDRA</strong><small>PLAYER</small><small className="brand-credit">Criado e editado por Adriel</small></div>
  </div>
}
