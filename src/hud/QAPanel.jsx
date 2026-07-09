import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, isEnriched } from '../store.js'
import { PanelLabel } from './AccentButton.jsx'

// Session Q&A avec l'agent du compte — le moment interactif (jury bienvenu).
export default function QAPanel() {
  const enriched = useStore(isEnriched)
  const open = useStore((s) => s.panels.qa)
  const history = useStore((s) => s.qaHistory)
  const askAgent = useStore((s) => s.askAgent)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  const show = enriched && open

  const submit = async (e) => {
    e.preventDefault()
    const question = q.trim()
    if (!question || busy) return
    setQ('')
    setBusy(true)
    await askAgent(question)
    setBusy(false)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 24,
        width: 360,
        maxHeight: 'calc(100vh - 120px)',
        display: 'flex',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass"
            style={{
              padding: 18,
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              maxHeight: '100%',
            }}
          >
            <PanelLabel>Ask the agent</PanelLabel>

            <div style={{ overflowY: 'auto', margin: '10px 0', flex: 1 }}>
              {history.length === 0 && (
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                  Try: "Who owns the budget?" · "What's the angle for Marc?" ·
                  "What's new on the account?"
                </div>
              )}
              {history.map((h, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12.5, color: '#22d3ee', fontWeight: 600 }}>▸ {h.q}</div>
                  <div style={{ fontSize: 12.5, color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: 1.55, marginTop: 3 }}>
                    {h.a}
                    <span style={{ color: '#4b5563', fontSize: 10, marginLeft: 6 }}>· {h.mode}</span>
                  </div>
                </div>
              ))}
              {busy && <div style={{ fontSize: 12, color: '#6b7280' }}>the agent is thinking…</div>}
            </div>

            <form onSubmit={submit} style={{ display: 'flex', gap: 6 }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Your question about the account…"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  color: '#e5e7eb',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={busy}
                style={{
                  background: busy ? '#164e5a' : '#22d3ee',
                  color: '#001014',
                  border: 'none',
                  padding: '9px 14px',
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: busy ? 'default' : 'pointer',
                }}
              >
                →
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
