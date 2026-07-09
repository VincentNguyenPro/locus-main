import { AnimatePresence, motion } from 'framer-motion'
import { useStore, isEnriched } from '../store.js'
import AccentButton, { PanelLabel } from './AccentButton.jsx'

// Email de relance rédigé par l'agent — la preuve de valeur finale.
export default function EmailPanel() {
  const email = useStore((s) => s.emailDraft)
  const phase = useStore((s) => s.phase)
  const sendEmail = useStore((s) => s.sendEmail)
  const emailSentReal = useStore((s) => s.emailSentReal)
  const enriched = useStore(isEnriched)
  const open = useStore((s) => s.panels.email)
  const show = email && enriched && open

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 'min(460px, 92vw)',
        maxHeight: '55vh',
        overflowY: 'auto',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="glass"
            style={{ padding: 20, pointerEvents: 'auto' }}
          >
            <PanelLabel>Follow-up drafted by the agent</PanelLabel>
            <div style={{ fontSize: 14, fontWeight: 600, margin: '8px 0 4px' }}>
              Subject: {email.subject}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#cbd5e1', whiteSpace: 'pre-wrap', margin: 0 }}>
              {email.body}
            </p>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AccentButton onClick={sendEmail} disabled={phase === 'EMAIL_SENT'}>
                {phase === 'EMAIL_SENT' ? 'Sent ✓' : 'Send'}
              </AccentButton>
              {phase === 'EMAIL_SENT' && emailSentReal && (
                <span style={{ fontSize: 12, color: '#22d3ee' }}>sent for real via Resend — check your inbox</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
