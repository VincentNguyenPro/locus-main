import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store.js'

// L'entrée cinématique : un VRAI couloir (photo, NYLO Hotel — Flickr CC-BY).
// Plaques discrètes sur les portes ; elles s'étendent AU SURVOL —
// Sephora révèle « Enter → », les autres leur statut.
const DOORS = [
  { id: 'sephora', name: 'SEPHORA', x: '47%', y: '36%', main: true, info: 'meeting yesterday · 1 unknown decision-maker' },
  { id: 'loreal', name: "L'ORÉAL", x: '16%', y: '31%', info: 'new signal yesterday', enterable: true },
  { id: 'chanel', name: 'CHANEL', x: '81%', y: '27%', info: 'call last week · warm', enterable: true },
  { id: 'qonto', name: 'QONTO', x: '85%', y: '56%', info: 'first meeting Friday' },
]

export default function PhotoCorridor() {
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
          exit={{ opacity: 0, transition: { duration: 0.9 } }}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0a0c10',
            display: 'flex',
            justifyContent: 'center',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {/* le panneau photo — zoom vers la porte du fond quand on entre */}
          <motion.div
            animate={
              entering
                ? { scale: 2.6, opacity: 0.25, filter: 'brightness(1.25)' }
                : { scale: 1, opacity: 1, filter: 'brightness(1)' }
            }
            transition={
              entering
                ? { duration: 4.8, ease: [0.45, 0, 0.55, 1] }
                : { duration: 0.6 }
            }
            style={{
              position: 'relative',
              height: '100vh',
              transformOrigin: '50% 40%', // la porte lumineuse du fond
            }}
          >
            <img
              src="/corridor.jpg"
              alt="The hallway of accounts"
              style={{
                height: '100%',
                width: 'auto',
                display: 'block',
                // fondu latéral vers le fond de page (panneau cinématique)
                WebkitMaskImage:
                  'linear-gradient(90deg, transparent, black 14%, black 86%, transparent)',
                maskImage:
                  'linear-gradient(90deg, transparent, black 14%, black 86%, transparent)',
              }}
            />

            {/* étiquettes de comptes posées sur les portes de la photo.
                Positionnement (translate) sur le wrapper, animation sur l'enfant —
                framer-motion écraserait le transform sinon. */}
            {DOORS.map((d) => (
              <div
                key={d.id}
                style={{
                  position: 'absolute',
                  left: d.x,
                  top: d.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
              <DoorChip
                d={d}
                entering={entering}
                hovered={hovered === d.id}
                onHover={setHovered}
                onEnter={d.main || d.enterable ? () => enterBuilding(d.id) : undefined}
              />
              </div>
            ))}
          </motion.div>

          {/* vignette basse pour asseoir les panneaux HUD (voir DoorChip plus bas) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(10,12,16,0.35) 0%, transparent 25%, transparent 70%, rgba(10,12,16,0.85) 100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Plaque de porte : discrète par défaut, s'étend au survol.
// Sephora (main) : survol → « info · Enter → », clic = entrer.
// Les autres : survol → leur statut.
function DoorChip({ d, entering, hovered, onHover, onEnter }) {
  const main = d.main
  const expanded = hovered && !entering
  return (
    <motion.button
      onClick={onEnter}
      onMouseEnter={() => onHover(d.id)}
      onMouseLeave={() => onHover(null)}
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: entering ? 0 : 1,
        y: 0,
        scale: expanded ? 1.05 : 1,
      }}
      transition={
        entering
          ? { delay: main ? 1.6 : 0, duration: 0.8 }
          : { delay: main ? 0.3 : 0.6, duration: 0.35 }
      }
      style={{
        pointerEvents: 'auto',
        cursor: main || d.enterable ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: main ? '5px 12px' : '3px 10px',
        borderRadius: 8,
        whiteSpace: 'nowrap',
        fontSize: main ? 12.5 : 11,
        fontWeight: main ? 700 : 500,
        letterSpacing: 1.5,
        color: main ? '#22d3ee' : '#cbd5e1',
        background: 'rgba(10,12,16,0.6)',
        border: main ? '1px solid rgba(34,211,238,0.55)' : '1px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(4px)',
        boxShadow: expanded && main ? '0 0 26px rgba(34,211,238,0.35)' : 'none',
      }}
    >
      {main && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', flexShrink: 0 }} />
      )}
      {d.name}
      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', fontWeight: 400, fontSize: 11, color: main ? '#a5f3fc' : '#9ca3af' }}
          >
            {d.info}
            {(main || d.enterable) && <b style={{ marginLeft: 8, color: '#22d3ee' }}>Enter →</b>}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
