import { AnimatePresence, motion } from 'framer-motion'
import { useStore, isEnriched } from '../store.js'

// Dock anti-surcharge : après l'enrichissement, Intel et Relance s'ouvrent
// À LA DEMANDE — la 3D reste le héros, le présentateur déplie quand il en parle.
export default function Dock() {
  const enriched = useStore(isEnriched)
  const panels = useStore((s) => s.panels)
  const togglePanel = useStore((s) => s.togglePanel)

  return (
    <div style={{ position: 'absolute', bottom: 24, left: 24, pointerEvents: 'none' }}>
      <AnimatePresence>
        {enriched && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="glass"
            style={{ display: 'flex', gap: 6, padding: 8, pointerEvents: 'auto' }}
          >
            <Chip active={panels.intel} onClick={() => togglePanel('intel')}>
              ◈ Intel
            </Chip>
            <Chip active={panels.email} onClick={() => togglePanel('email')}>
              ✉ Follow-up
            </Chip>
            <Chip active={panels.qa} onClick={() => togglePanel('qa')}>
              ❓ Ask
            </Chip>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#22d3ee' : 'rgba(255,255,255,0.06)',
        color: active ? '#001014' : '#cbd5e1',
        border: '1px solid ' + (active ? '#22d3ee' : 'rgba(255,255,255,0.12)'),
        padding: '8px 14px',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
