import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, isEnriched } from '../store.js'

// Simplifié : la porte du couloir est le CTA d'entrée, la deal room a le sien.
// Ce composant ne garde que : le prewarm au chargement, le toast d'erreur,
// et la pastille phase+Reset une fois enrichi.
export default function BriefingPanel() {
  // Prewarm FullEnrich dès l'affichage : l'enrichissement live tourne pendant
  // que le présentateur parle (~30s), le run le trouve prêt. Idempotent côté serveur.
  useEffect(() => {
    fetch('/prewarm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {})
  }, [])
  const phase = useStore((s) => s.phase)
  const error = useStore((s) => s.error)
  const reset = useStore((s) => s.reset)
  const enriched = useStore(isEnriched)

  return (
    <>
      {/* pastille discrète une fois enrichi : phase + Reset */}
      {enriched && (
        <div style={{ position: 'absolute', bottom: 24, left: 330, pointerEvents: 'none' }}>
          <div
            className="glass"
            style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', pointerEvents: 'auto' }}
          >
            <button
              onClick={reset}
              style={{
                background: 'transparent',
                color: '#9ca3af',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* toast d'erreur (backend down, timeout) — visible dans toutes les phases */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass"
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              padding: '10px 14px',
              fontSize: 12.5,
              color: '#f87171',
              pointerEvents: 'auto',
            }}
          >
            ⚠ {error}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
