import Logo from './Logo'
function HydraHead({ position = 'center' }) {
  return <svg className={`hydra-head ${position}`} viewBox="0 0 120 100" aria-hidden="true">
    <path d="M60 99 C58 82 58 66 58 51 C39 49 21 37 22 21 C23 9 36 4 49 10 L60 18 L72 8 C89 1 103 10 100 25 C97 40 80 49 65 51 C65 68 68 84 70 99Z" fill="url(#hydraGlow)" stroke="#c8a9ff" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M28 22 L13 8 L42 13 M93 21 L108 7 L83 13" fill="none" stroke="#9c6aff" strokeWidth="5" strokeLinecap="round"/>
    <path d="M38 31 Q48 24 56 32 M65 32 Q76 24 84 31" fill="none" stroke="#f2e9ff" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="48" cy="31" r="3" fill="#fff"/><circle cx="75" cy="31" r="3" fill="#fff"/>
    <path d="M48 43 Q60 49 73 43" fill="none" stroke="#4b267c" strokeWidth="3" strokeLinecap="round"/>
    <defs><linearGradient id="hydraGlow" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d6b8ff"/><stop offset="1" stopColor="#5426a8"/></linearGradient></defs>
  </svg>
}
export default function Splash({ message = 'Preparando o aplicativo…' }) {
  return <div className="splash-screen" role="status" aria-live="polite">
    <div className="orb orb-a" /><div className="orb orb-b" />
    <div className="splash-content"><Logo />
      <div className="hydra-rise"><HydraHead position="left"/><HydraHead position="center"/><HydraHead position="right"/></div>
      <div className="loader-ring"><span /></div>
      <h1>Seu entretenimento.<br/><span>Em outra dimensão.</span></h1>
      <p>{message}</p>
    </div>
  </div>
}
