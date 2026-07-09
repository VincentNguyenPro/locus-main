import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store.js'
import AccentButton, { PanelLabel } from './AccentButton.jsx'

// The deal room — WHO is in the room, WHAT they said, WHY it matters.
// Shown after the corridor zoom, before the agent runs: no cold screen,
// every person introduced with their role, stance and transcript quote.
const cache = new Map()

const RING = { known: '#94a3b8', unknown_target: '#22d3ee' }

export default function MeetingRoom() {
  const phase = useStore((s) => s.phase)
  const runAgent = useStore((s) => s.runAgent)
  const account = useStore((s) => s.currentAccount)
  const [data, setData] = useState(cache.get(account))

  useEffect(() => {
    if (cache.has(account)) {
      setData(cache.get(account))
      return
    }
    fetch(`/account?name=${account}`)
      .then((r) => r.json())
      .then((d) => {
        cache.set(account, d)
        setData(d)
      })
      .catch(() => {})
  }, [account])

  const show = phase === 'ROOM_OPEN' && data

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0a0c10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ width: 'min(980px, 94vw)' }}>
            {/* header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ textAlign: 'center', marginBottom: 28 }}
            >
              <PanelLabel>Deal room · {data.account?.name}</PanelLabel>

              {/* L'historique du compte : d'où vient cette réunion, et pourquoi celle-là */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0,
                  margin: '16px 0 6px',
                }}
              >
                {(data.account?.timeline ?? []).map((ev, i) => (
                  <div key={ev.date} style={{ display: 'flex', alignItems: 'center' }}>
                    {i > 0 && (
                      <div style={{ width: 46, height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 10px' }} />
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: ev.latest ? 11 : 8,
                          height: ev.latest ? 11 : 8,
                          borderRadius: '50%',
                          margin: '0 auto 5px',
                          background: ev.latest ? '#22d3ee' : 'rgba(255,255,255,0.25)',
                          boxShadow: ev.latest ? '0 0 10px rgba(34,211,238,0.6)' : 'none',
                        }}
                      />
                      <div style={{ fontSize: 11, color: ev.latest ? '#22d3ee' : '#6b7280', fontWeight: ev.latest ? 700 : 400 }}>
                        {ev.date}
                      </div>
                      <div style={{ fontSize: 11, color: ev.latest ? '#e5e7eb' : '#6b7280' }}>{ev.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ margin: '18px 0 4px', fontSize: 17, fontWeight: 600, color: '#e5e7eb' }}>
                Built from the latest meeting, recorded &amp; transcribed.
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
                3 stakeholders · 2 known · <b style={{ color: '#22d3ee' }}>1 to identify</b>
              </p>
            </motion.div>

            {/* the three people in the room — the committee member (CRO above
                Marc) is not an attendee; the agent surfaces her later, in the graph */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {(data.stakeholders ?? []).filter((p) => p.status !== 'committee').map((p, i) => {
                const unknown = p.status === 'unknown_target'
                return (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="glass"
                    style={{
                      padding: 18,
                      border: unknown ? '1px solid rgba(34,211,238,0.4)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                          color: unknown ? '#0a0c10' : '#e5e7eb',
                          background: unknown ? 'rgba(138,143,152,0.6)' : 'rgba(255,255,255,0.08)',
                          border: `2px solid ${RING[p.status] ?? '#94a3b8'}`,
                        }}
                      >
                        {unknown ? '?' : initials(p.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: unknown ? '#22d3ee' : '#e5e7eb' }}>
                          {unknown ? `Unknown · "${p.name.split(' ')[0]}"` : p.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{p.role}</div>
                      </div>
                    </div>

                    <p style={{ margin: '12px 0 0', fontSize: 12.5, lineHeight: 1.5, color: unknown ? '#22d3ee' : '#cbd5e1', fontStyle: unknown ? 'normal' : 'italic' }}>
                      {unknown ? p.stance : `"${p.quote}"`}
                    </p>
                  </motion.div>
                )
              })}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{ textAlign: 'center', marginTop: 28 }}
            >
              <AccentButton onClick={() => runAgent()}>Identify the decision-maker →</AccentButton>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('')
