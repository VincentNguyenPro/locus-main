import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store.js'
import { PanelLabel } from './AccentButton.jsx'

// The building directory — the scale in one glance: every account has a
// prepared deal room. Sephora is today's demo; the rest is the portfolio.
let cache = null

const COLS = '26px 1fr 48px 58px 104px'
const GAP = 10

export default function DirectoryBoard() {
  const phase = useStore((s) => s.phase)
  const enterBuilding = useStore((s) => s.enterBuilding)
  const [dir, setDir] = useState(cache)
  const [risk, setRisk] = useState(null) // compte à risque cliqué → carte détail

  useEffect(() => {
    if (cache) return
    fetch('/account')
      .then((r) => r.json())
      .then((d) => {
        cache = d.directory ?? []
        setDir(cache)
      })
      .catch(() => {})
  }, [])

  const show = phase === 'LOBBY' && dir

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        width: 440,
        maxHeight: 'calc(100vh - 120px)',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="glass"
            style={{ padding: 18, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', maxHeight: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <PanelLabel>Directory</PanelLabel>
              <span style={{ fontSize: 11, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
                {dir.length} deal rooms
              </span>
            </div>

            {/* column headers — same grid + gap as the rows so they line up */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                gap: GAP,
                alignItems: 'end',
                padding: '12px 8px 6px',
                fontSize: 9.5,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: '#4b5563',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                whiteSpace: 'nowrap',
              }}
            >
              <span />
              <span style={{ overflow: 'hidden' }}>Account</span>
              <span style={{ textAlign: 'right' }}>Signals</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span style={{ textAlign: 'right' }}>Last activity</span>
            </div>

            <div style={{ overflowY: 'auto' }}>
              {dir.map((a) => {
                const main = a.name === 'Sephora'
                const ids = { Sephora: 'sephora', "L'Oréal": 'loreal', Chanel: 'chanel' }
                const enterable = ids[a.name]
                const ready = a.status === 'ready'
                const isRisk = Boolean(a.risk)
                const riskOpen = risk?.name === a.name
                return (
                  <div
                    key={a.name}
                    onClick={
                      enterable
                        ? () => enterBuilding(enterable)
                        : isRisk
                        ? () => setRisk((r) => (r?.name === a.name ? null : a))
                        : undefined
                    }
                    style={{
                      display: 'grid',
                      gridTemplateColumns: COLS,
                      gap: GAP,
                      alignItems: 'center',
                      padding: '7px 8px',
                      borderRadius: 8,
                      cursor: enterable || isRisk ? 'pointer' : 'default',
                      background: main
                        ? 'rgba(34,211,238,0.10)'
                        : riskOpen
                        ? 'rgba(251,191,36,0.10)'
                        : 'transparent',
                      border: main
                        ? '1px solid rgba(34,211,238,0.35)'
                        : riskOpen
                        ? '1px solid rgba(251,191,36,0.35)'
                        : '1px solid transparent',
                    }}
                  >
                    <Monogram name={a.name} ready={ready} main={main} />
                    {/* name + badge on one row, why underneath — each ellipsizes
                        within the cell instead of overflowing into Signals */}
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: main ? 700 : 500,
                            color: main ? '#22d3ee' : '#e5e7eb',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {a.name}
                        </span>
                        {a.today && (
                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: 9,
                              padding: '2px 6px',
                              borderRadius: 5,
                              letterSpacing: 0.8,
                              fontWeight: 700,
                              background: '#22d3ee',
                              color: '#001014',
                            }}
                          >
                            TODAY
                          </span>
                        )}
                      </div>
                      {a.why && (
                        <div
                          style={{
                            fontSize: 10,
                            color: '#67e8f9',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {a.why}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {a.signals > 0 ? a.signals : '—'}
                    </span>
                    <span style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          minWidth: 42,
                          textAlign: 'center',
                          fontSize: 9.5,
                          padding: '2px 0',
                          borderRadius: 6,
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          background: ready ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.06)',
                          color: ready ? '#22d3ee' : '#6b7280',
                        }}
                      >
                        {ready ? 'ready' : 'prep'}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: isRisk ? '#fbbf24' : '#6b7280',
                        fontWeight: isRisk ? 600 : 400,
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                      }}
                    >
                      {isRisk ? `⚠ ${a.last}` : a.last}
                    </span>
                  </div>
                )
              })}
            </div>

            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                Built overnight from calendar and call transcripts.
                <b style={{ color: '#9ca3af' }}> Day one, no setup.</b>
              </span>
              <ConnectButton />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Risk card — the agent doesn't only prep, it WARNS. Opened from a
          flagged directory row (e.g. Back Market · champion left). */}
      <AnimatePresence>
        {show && risk && (
          <motion.div
            key={risk.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="glass"
            style={{
              position: 'absolute',
              top: 96,
              right: 456,
              width: 300,
              padding: 18,
              pointerEvents: 'auto',
              border: '1px solid rgba(251,191,36,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <span style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#fbbf24', fontWeight: 700 }}>
                ⚠ Deal at risk · {risk.name}
              </span>
              <button
                onClick={() => setRisk(null)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 600, color: '#e5e7eb', lineHeight: 1.5 }}>
              {risk.risk.text}
            </p>
            {risk.risk.why && (
              <p style={{ margin: '8px 0 0', fontSize: 12.5, color: '#9ca3af', lineHeight: 1.5 }}>{risk.risk.why}</p>
            )}
            {risk.risk.action && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#e5e7eb',
                }}
              >
                <b style={{ color: '#fbbf24' }}>→ Save · </b>
                {risk.risk.action}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Monogramme uniforme : initiale + teinte dérivée du nom (pas de faux logos).
function Monogram({ name, ready, main }) {
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10.5,
        fontWeight: 700,
        color: main ? '#001014' : '#e5e7eb',
        background: main ? '#22d3ee' : `hsl(${hue} 30% 26%)`,
        opacity: ready ? 1 : 0.45,
      }}
    >
      {name[0]}
    </span>
  )
}

// Bouton Connect (maquette) : montre le geste day-one, sans backend.
function ConnectButton() {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'rgba(34,211,238,0.12)',
          color: '#22d3ee',
          border: '1px solid rgba(34,211,238,0.35)',
          padding: '6px 11px',
          borderRadius: 8,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        + Connect
      </button>
      {open && (
        <span
          className="glass"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            right: 0,
            padding: '10px 12px',
            fontSize: 11.5,
            color: '#cbd5e1',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          <b style={{ color: '#e5e7eb' }}>Sources</b>
          <span style={{ display: 'block', marginTop: 4, color: '#9ca3af' }}>
            Google Calendar · connected
            <br />
            Gong / Fireflies · connected
            <br />
            Email · connected
            <br />
            HubSpot · <span style={{ color: '#22d3ee' }}>connect →</span>
          </span>
        </span>
      )}
    </span>
  )
}
