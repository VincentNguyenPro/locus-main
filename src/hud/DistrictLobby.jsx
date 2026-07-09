import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store.js'

// The entrance — a top-down district map (public/district.jpg). Each account is
// a building; Sephora is today's demo, L'Oréal + Chanel are enterable, the rest
// frame the portfolio. Clicking an enterable label descends into the deal room.
//
// Positions are % of the frame — tuned to the buildings in district.jpg. Adjust
// x/y here to sit each label on its building.
//
// `score` (0–1) is the closing signal strength — recent activity, engaged
// stakeholders, buying signs picked up by the agent. It doesn't move the pin
// (the building stays put), it drives the halo: the stronger the signal, the
// more the account glows, as if it were sitting closer to the center of
// attention.
const ACCOUNTS = [
  { name: 'Sephora', id: 'sephora', main: true, today: true, score: 0.94, x: '47%', y: '30%' },
  { name: "L'Oréal", id: 'loreal', score: 0.71, x: '34%', y: '36%' },
  { name: 'Chanel', id: 'chanel', score: 0.58, x: '60%', y: '34%' },
  { name: 'Doctolib', score: 0.44, x: '29%', y: '52%' },
  { name: 'Veepee', score: 0.31, x: '58%', y: '52%' },
  { name: 'Alan', score: 0.52, x: '37%', y: '64%' },
  { name: 'Contentsquare', score: 0.39, x: '50%', y: '69%' },
  { name: 'Back Market', score: 0.26, x: '45%', y: '78%' },
  { name: 'Decathlon', score: 0.47, x: '21%', y: '42%' },
]

export default function DistrictLobby() {
  const phase = useStore((s) => s.phase)
  const enterBuilding = useStore((s) => s.enterBuilding)
  const [hovered, setHovered] = useState(null)

  const show = phase === 'LOBBY' || phase === 'ELEVATOR'
  const entering = phase === 'ELEVATOR'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0a0c10',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {/* the map — darkened + blue-tinted to sit in the dark ops theme,
              slow zoom toward the district when entering */}
          <motion.div
            animate={entering ? { scale: 1.6 } : { scale: 1 }}
            transition={entering ? { duration: 4.8, ease: [0.45, 0, 0.55, 1] } : { duration: 0.6 }}
            style={{ position: 'absolute', inset: 0, transformOrigin: '47% 47%' }}
          >
            <img
              src="/district.jpg"
              alt="District of accounts"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                filter: 'brightness(0.92) saturate(1.05)',
              }}
            />
            {/* soft vignette + darker bottom so the labels and caption read,
                without hiding the map the map is the hero */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(130% 100% at 47% 47%, transparent 42%, rgba(18,28,42,0.28) 100%), linear-gradient(180deg, rgba(10,12,16,0.25) 0%, transparent 22%, transparent 60%, rgba(10,12,16,0.7) 100%)',
              }}
            />

            {/* account labels pinned on the buildings */}
            {ACCOUNTS.map((a) => (
              <div key={a.name} style={{ position: 'absolute', left: a.x, top: a.y, transform: 'translate(-50%, -50%)' }}>
                <AccountPin
                  a={a}
                  entering={entering}
                  hovered={hovered === a.name}
                  onHover={setHovered}
                  onEnter={a.id ? () => enterBuilding(a.id) : undefined}
                />
              </div>
            ))}
          </motion.div>

          {/* legend — what the halo means, so "closer to the center of
              attention" reads as a signal, not decoration */}
          <div
            className="glass"
            style={{
              position: 'absolute',
              left: 24,
              bottom: 24,
              padding: '10px 14px',
              opacity: entering ? 0 : 1,
              transition: 'opacity 0.4s',
            }}
          >
            <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#4b5563', marginBottom: 6 }}>
              Signal strength
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1', boxShadow: '0 0 3px rgba(203,213,225,0.3)' }} />
              <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, rgba(203,213,225,0.5), rgba(34,211,238,0.9))' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 14px rgba(34,211,238,0.8)' }} />
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>Brighter halo → closer to closing</div>
          </div>

          {/* ranking — every client, sorted by signal strength descending */}
          <div
            className="glass"
            style={{
              position: 'absolute',
              right: 24,
              top: 24,
              padding: '12px 14px',
              minWidth: 176,
              opacity: entering ? 0 : 1,
              transition: 'opacity 0.4s',
            }}
          >
            <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#4b5563', marginBottom: 8 }}>
              Ranking · signal
            </div>
            {[...ACCOUNTS]
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .map((a) => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2.5px 0' }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: scoreColor(a.score ?? 0.3),
                      boxShadow: `0 0 ${4 + (a.score ?? 0.3) * 10}px ${scoreColor(a.score ?? 0.3)}`,
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#d1d5db', flex: 1 }}>{a.name}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round((a.score ?? 0) * 100)}%
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Faible signal → gris discret. Fort signal → cyan, halo large — comme si le
// compte s'était rapproché du centre de l'attention de l'agent.
function scoreColor(score) {
  return mix('#cbd5e1', '#22d3ee', score)
}

function mix(hexLo, hexHi, t) {
  const c = Math.max(0, Math.min(1, t))
  const toHex = (n) => n.toString(16).padStart(2, '0')
  const [r1, g1, b1] = [hexLo.slice(1, 3), hexLo.slice(3, 5), hexLo.slice(5, 7)].map((h) => parseInt(h, 16))
  const [r2, g2, b2] = [hexHi.slice(1, 3), hexHi.slice(3, 5), hexHi.slice(5, 7)].map((h) => parseInt(h, 16))
  const r = Math.round(r1 + (r2 - r1) * c)
  const g = Math.round(g1 + (g2 - g1) * c)
  const b = Math.round(b1 + (b2 - b1) * c)
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexA(hex, a) {
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16))
  return `rgba(${r},${g},${b},${a})`
}

// A label on a building. Sephora (main) glows + pulses + "TODAY"; L'Oréal/Chanel
// are enterable; the rest are quiet portfolio markers.
function AccountPin({ a, entering, hovered, onHover, onEnter }) {
  const enterable = Boolean(a.id)
  const expanded = hovered && !entering
  const score = a.score ?? 0.3
  const accent = scoreColor(score)
  const hot = score >= 0.6 // strong enough signal to pulse, like Sephora used to alone
  const haloBlur = Math.round(6 + score * 30)
  const haloAlpha = 0.1 + score * 0.5
  return (
    <motion.button
      onClick={onEnter}
      onMouseEnter={() => onHover(a.name)}
      onMouseLeave={() => onHover(null)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: entering ? 0 : 1, y: 0, scale: expanded ? 1.06 : 1 }}
      transition={entering ? { duration: 0.5 } : { duration: 0.35 }}
      style={{
        pointerEvents: 'auto',
        cursor: enterable ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: a.main ? '5px 11px' : '4px 9px',
        borderRadius: 8,
        whiteSpace: 'nowrap',
        fontSize: a.main ? 12.5 : 11,
        fontWeight: a.main ? 700 : 500,
        letterSpacing: 0.6,
        color: accent,
        background: 'rgba(8,11,15,0.72)',
        border: `1px solid ${hexA(accent, 0.25 + score * 0.5)}`,
        backdropFilter: 'blur(3px)',
        boxShadow: `0 0 ${haloBlur}px ${hexA(accent, haloAlpha)}`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          flexShrink: 0,
          background: accent,
          boxShadow: `0 0 ${4 + score * 10}px ${accent}`,
          animation: hot ? 'districtPulse 1.6s ease-in-out infinite' : 'none',
        }}
      />
      {a.name}
      {a.today && (
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, padding: '2px 6px', borderRadius: 5, background: '#22d3ee', color: '#001014' }}>
          TODAY
        </span>
      )}
      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', color: accent, fontSize: 10, letterSpacing: 0.4 }}
          >
            {Math.round(score * 100)}% signal
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {expanded && enterable && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <b style={{ color: '#22d3ee' }}>Enter →</b>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
