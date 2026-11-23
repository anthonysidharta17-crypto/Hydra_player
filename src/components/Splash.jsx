import Logo from './Logo'

export default function Splash({ message = 'Preparando o aplicativo…' }) {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <div className="orb orb-a" /><div className="orb orb-b" />
      <div className="splash-content">
        <Logo />
        <div className="loader-ring"><span /></div>
        <h1>Seu entretenimento.<br /><span>Em outra dimensão.</span></h1>
        <p>{message}</p>
      </div>
    </div>
  )
}
