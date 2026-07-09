import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store.js'
import { PanelLabel } from './AccentButton.jsx'

// Node detail — every click answers "so what?": what was said, why it
// matters, and what to DO about it. Not metadata: playbook.
export default function NodeDetail() {
  const selected = useStore((s) => s.selected)
  const setSelected = useStore((s) => s.setSelected)
  const intel = useStore((s) => s.intel)
  const contact = useStore((s) => s.enrichedContacts.main)

  const detail = selected && selected.id !== 'target' ? render(selected, intel, contact) : null

  return (
    <div style={{ position: 'absolute', top: 24, right: 24, width: 330, pointerEvents: 'none' }}>
      <AnimatePresence>
        {detail && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="glass"
            style={{ padding: 18, pointerEvents: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <PanelLabel>{detail.label}</PanelLabel>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: '#cbd5e1' }}>{detail.body}</div>
            {detail.action && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(34,211,238,0.08)',
                  border: '1px solid rgba(34,211,238,0.25)',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                <b style={{ color: '#22d3ee' }}>→ Play · </b>
                {detail.action}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function render(sel, intel, contact) {
  if (sel.type === 'signal') {
    const i = Number(sel.id.replace('sig', ''))
    const s = intel?.sillage?.signals?.[i]
    if (!s) return null
    return {
      label: `Sillage signal · ${s.recency}`,
      body: (
        <>
          <p style={{ margin: 0, fontWeight: 600, color: '#e5e7eb' }}>{s.text}</p>
          {s.why && <p style={{ margin: '8px 0 0' }}>{s.why}</p>}
        </>
      ),
      action: s.action,
    }
  }
  if (sel.type === 'promise') {
    const i = Number(sel.id.replace('prom', ''))
    const p = intel?.insights?.promesses?.[i]
    if (!p) return null
    return {
      label: 'Open commitment',
      body: (
        <>
          <p style={{ margin: 0, fontWeight: 600, color: '#e5e7eb' }}>◻ {p.text}</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
            owner: {p.owner} · due: {p.due}
          </p>
        </>
      ),
      action: p.action,
    }
  }
  if (sel.type === 'account') {
    const c = contact?.details?.company
    return {
      label: 'Account',
      body: (
        <>
          <b style={{ color: '#e5e7eb' }}>{c?.name ?? 'Account'}</b>
          <p style={{ margin: '4px 0 0' }}>{[c?.industry, c?.size].filter(Boolean).join(' · ')}</p>
          {intel?.insights?.angle && <p style={{ margin: '10px 0 0', fontSize: 12, color: '#9ca3af' }}>{intel.insights.angle}</p>}
        </>
      ),
    }
  }
  if (sel.type === 'event') {
    const target = intel?.stakeholders?.find((p) => p.status === 'unknown_target')
    const known = (intel?.stakeholders ?? []).filter((p) => p.status !== 'unknown_target')
    return {
      label: 'Latest meeting',
      body: (
        <p style={{ margin: 0 }}>
          {known.map((p) => p.name.split(' ')[0]).join(' + ')} present.
          {target ? ` ${target.name.split(' ')[0]} mentioned, absent: the ${target.role}.` : ''} Transcript
          read and mined by the agent.
        </p>
      ),
      action: 'Every node around this meeting came out of one transcript. Zero manual note-taking.',
    }
  }
  if (sel.type === 'person') {
    const st = intel?.stakeholders?.find((p) => p.name === sel.label)
    if (!st) return { label: 'Stakeholder', body: <b style={{ color: '#e5e7eb' }}>{sel.label}</b> }
    return {
      label: 'Stakeholder',
      body: (
        <>
          <b style={{ color: '#e5e7eb' }}>{st.name}</b>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
            {st.role} — {st.stance}
          </p>
          {st.quote && (
            <p style={{ margin: '8px 0 0', fontStyle: 'italic' }}>"{st.quote}"</p>
          )}
        </>
      ),
      action: st.play,
    }
  }
  return null
}
