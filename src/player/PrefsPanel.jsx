import { describeDevice } from './ai'

function Row({ label, children }) {
  return (
    <div className="pf-row">
      <span className="pf-label">{label}</span>
      <div className="pf-opts">{children}</div>
    </div>
  )
}

function Opt({ on, onClick, children }) {
  return (
    <button type="button" className={`pf-opt${on ? ' on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  )
}

// Preferências do player. Também pode ser usado dentro de Configurações.
export default function PrefsPanel({ prefs, onChange, device }) {
  const set = patch => onChange(patch)
  return (
    <div className="pf">
      <Row label="Áudio preferido">
        <Opt on={prefs.audio === 'pt'} onClick={() => set({ audio: 'pt' })}>Dublado em português</Opt>
        <Opt on={prefs.audio === 'original'} onClick={() => set({ audio: 'original' })}>Original</Opt>
      </Row>
      <Row label="Legenda automática">
        <Opt on={prefs.subs === 'off'} onClick={() => set({ subs: 'off' })}>Desligada</Opt>
        <Opt on={prefs.subs === 'auto'} onClick={() => set({ subs: 'auto' })}>Se o áudio não for em português</Opt>
        <Opt on={prefs.subs === 'on'} onClick={() => set({ subs: 'on' })}>Sempre em português</Opt>
      </Row>
      <Row label="Tamanho da legenda">
        {[[80, 'Pequena'], [100, 'Normal'], [140, 'Grande'], [180, 'Enorme']].map(([v, name]) => (
          <Opt key={v} on={prefs.subSize === v} onClick={() => set({ subSize: v })}>{name}</Opt>
        ))}
      </Row>
      <Row label="Retomar de onde parou">
        <Opt on={prefs.resume} onClick={() => set({ resume: true })}>Sim</Opt>
        <Opt on={!prefs.resume} onClick={() => set({ resume: false })}>Não</Opt>
      </Row>
      <Row label="Salto dos botões">
        {[5, 10, 15, 30].map(v => (
          <Opt key={v} on={prefs.skip === v} onClick={() => set({ skip: v })}>{v} s</Opt>
        ))}
      </Row>
      <Row label="Próximo episódio automático">
        <Opt on={prefs.autoNext} onClick={() => set({ autoNext: true })}>Sim</Opt>
        <Opt on={!prefs.autoNext} onClick={() => set({ autoNext: false })}>Não</Opt>
      </Row>
      {device && (
        <details className="pf-diag">
          <summary>Diagnóstico do aparelho</summary>
          <dl>
            {describeDevice(device).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
            ))}
          </dl>
        </details>
      )}
    </div>
  )
}
