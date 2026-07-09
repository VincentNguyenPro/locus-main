import { AnimatePresence, motion } from 'framer-motion'
import { useStore, isEnriched } from '../store.js'
import { PanelLabel } from './AccentButton.jsx'

// Tout ce que l'agent sait du compte : stakeholders, angle, promesses,
// et le flux de signaux Sillage. Apparaît avec l'enrichissement.
export default function IntelPanel() {
  const intel = useStore((s) => s.intel)
  const enriched = useStore(isEnriched)
  const open = useStore((s) => s.panels.intel)
  const show = intel && enriched && open

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 24,
        width: 330,
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="glass"
            style={{ padding: 20, pointerEvents: 'auto' }}
          >
            <PanelLabel>Account intelligence</PanelLabel>

            {/* Stakeholders */}
            <Section title="Stakeholders">
              {(intel.stakeholders ?? []).map((p) => (
                <div key={p.name} style={{ padding: '5px 0', fontSize: 12.5 }}>
                  <span style={{ color: p.status === 'unknown_target' ? '#22d3ee' : '#e5e7eb', fontWeight: 600 }}>
                    {p.name}
                  </span>
                  <span style={{ color: '#6b7280' }}> · {p.role}</span>
                  {p.stance && <div style={{ color: '#9ca3af', fontSize: 11.5 }}>{p.stance}</div>}
                </div>
              ))}
            </Section>

            {/* Angle commercial */}
            {intel.insights?.angle && (
              <Section title="Sales angle">
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: '#cbd5e1' }}>
                  {intel.insights.angle}
                </p>
              </Section>
            )}

            {/* Promesses ouvertes */}
            {intel.insights?.promesses?.length > 0 && (
              <Section title="Open commitments">
                {intel.insights.promesses.map((p, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: '#cbd5e1', padding: '3px 0' }}>
                    ◻ {p.text} <span style={{ color: '#6b7280' }}>· {p.owner} · {p.due}</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Flux Sillage */}
            {intel.sillage?.signals?.length > 0 && (
              <Section title="Sillage signals">
                {intel.sillage.signals.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: '6px 0',
                      fontSize: 12,
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}
                  >
                    <span style={{ color: '#22d3ee', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      {s.recency}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>{s.text}</span>
                  </div>
                ))}
              </Section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  )
}
