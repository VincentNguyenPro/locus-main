import { AnimatePresence, motion } from 'framer-motion'
import { useStore, isEnriched } from '../store.js'
import { PanelLabel } from './AccentButton.jsx'

// Le dossier contact — TOUT ce que FullEnrich livre, pas juste email/tél.
// Apparition Framer Motion = effet n°2 (sur 2 max, règle de sobriété).
export default function ContactCard() {
  const contact = useStore((s) => s.enrichedContacts.main)
  const enriched = useStore(isEnriched)
  const selected = useStore((s) => s.selected)
  // Le dossier s'ouvre au CLIC sur le nœud Marc (graphe interactif).
  const show = contact && enriched && selected?.id === 'target'
  const d = contact?.details

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        width: 330,
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="glass"
            style={{ padding: 20, pointerEvents: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <PanelLabel>Enriched via FullEnrich {contact.isLive ? '· LIVE' : '· fixture'}</PanelLabel>
              <CloseBtn />
            </div>
            <h3 style={{ margin: '8px 0 2px', fontSize: 18, fontWeight: 600 }}>{contact.name}</h3>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>{d?.headline ?? contact.role}</div>
            {d?.location && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>📍 {d.location}</div>
            )}

            <Divider />

            {/* Tous les emails, avec niveau de confiance */}
            {(d?.emails?.length ? d.emails : [{ email: contact.email, status: 'VERIFIED' }]).map(
              (e) => (
                <Row key={e.email} label={<Badge status={e.status} />} value={e.email} />
              ),
            )}
            {(d?.phones?.length ? d.phones : [{ number: contact.phone }]).map(
              (p) => p.number && <Row key={p.number} label="Phone" value={p.number} />,
            )}
            {d?.linkedin && (
              <Row
                label="LinkedIn"
                value={
                  <a href={d.linkedin} target="_blank" rel="noreferrer" style={{ color: '#22d3ee' }}>
                    profile ↗
                  </a>
                }
              />
            )}

            {/* Société */}
            {d?.company && (
              <>
                <Divider />
                <div style={{ fontSize: 12.5, color: '#e5e7eb', fontWeight: 600 }}>{d.company.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  {[d.company.industry, d.company.size].filter(Boolean).join(' · ')}
                </div>
              </>
            )}

            {/* Signal principal */}
            {contact.signal && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.25)',
                  fontSize: 12,
                }}
              >
                <b style={{ color: '#22d3ee' }}>Sillage signal · </b>
                {contact.signal}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Divider = () => (
  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
)

function CloseBtn() {
  const setSelected = useStore((s) => s.setSelected)
  return (
    <button
      onClick={() => setSelected(null)}
      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}
    >
      ✕
    </button>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '3px 0' }}>
      <span style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ color: '#e5e7eb', fontFamily: 'monospace', overflowWrap: 'anywhere', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

// Niveau de confiance FullEnrich, lisible d'un coup d'œil.
function Badge({ status }) {
  const ok = status === 'VERIFIED' || status === 'VALID'
  return (
    <span
      style={{
        fontSize: 10,
        padding: '2px 6px',
        borderRadius: 6,
        background: ok ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.08)',
        color: ok ? '#22d3ee' : '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {ok ? 'verified' : 'probable'}
    </span>
  )
}
