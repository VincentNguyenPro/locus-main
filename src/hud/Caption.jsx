import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store.js'

// Scene captions: tell the viewer WHAT they are looking at and whether any
// action is expected. Nobody should ever wonder "where do I click?".
const CAPTIONS = {
  LOBBY: {
    title: 'Locus',
    sub: 'Every door is an account with a prepared deal room. Today: Sephora.',
  },
  ELEVATOR: {
    title: 'Entering Sephora',
    sub: 'Briefing in progress. No action needed.',
  },
  ENRICHING: {
    title: 'The agent is working…',
    sub: 'Reading the transcript · FullEnrich enrichment · Sillage signals',
  },
  ENRICHED: {
    title: 'Decision-maker identified',
    sub: 'Click the nodes to explore. Intel and Follow-up are in the dock.',
  },
}

const NAMES = { sephora: 'Sephora', loreal: "L'Oréal", chanel: 'Chanel' }

export default function Caption() {
  const phase = useStore((s) => s.phase)
  const account = useStore((s) => s.currentAccount)
  const contactName = useStore((s) => s.enrichedContacts.main?.name)
  const base = CAPTIONS[phase]
  let c = base
  if (base && phase === 'ELEVATOR') c = { ...base, title: `Entering ${NAMES[account] ?? account}` }
  if (base && phase === 'ENRICHED' && contactName) c = { ...base, title: `${contactName} identified` }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        textAlign: 'center',
        width: 'min(680px, 90vw)',
      }}
    >
      <AnimatePresence mode="wait">
        {c && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <div style={{ fontSize: 17, fontWeight: 600, color: '#e5e7eb', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
              {c.title}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4, textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
              {c.sub}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
