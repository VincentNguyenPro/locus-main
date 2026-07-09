import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, isEnriched } from '../store.js'

// The account graph, Obsidian-style — the agent's view of the deal.
// DETERMINISTIC choreography: every node has a designed final position and
// is born there (fade+scale). The camera is FIXED — framed once for the
// final composition. No physics chaos, no camera chase. A gentle idle
// float keeps the canvas alive.
const CYAN = '#22d3ee'
const GREY = '#8a8f98'

const BIRTH_MS = 1300 // per-node entrance (drift + fade + scale)
const TOTAL_STEPS = 14
// Rythme RESPIRÉ, pas un métronome : cascades rapides, pauses dramatiques.
// Index i = délai avant le pas i+1. (13 = pause avant la révélation du comité)
const STEP_DELAYS = [400, 900, 750, 700, 950, 1000, 600, 550, 550, 1500, 900, 650, 950, 1200]

// ── La composition (positions finales, dessinées à la main) ──────────────────
const POS = {
  meeting: [0, 30],
  account: [150, -50],
  p0: [-130, 110],
  p1: [10, 160],
  target: [-160, -30],
  p2: [-90, -155], // le CRO au-dessus de Marc, surfacé par l'agent (comité)
  sig0: [-300, -80], // le signal job_change, accroché à Marc
  sig1: [300, -150],
  sig2: [330, 10],
  sig3: [180, -200],
  prom0: [140, 150],
  prom1: [280, 120],
  email: [-300, 70],
}
// Cadre de la composition finale (avec marge pour les labels)
const EXTENT = { cx: 10, cy: -10, w: 780, h: 520 }

export default function AccountGraph() {
  const phase = useStore((s) => s.phase)
  const intel = useStore((s) => s.intel)
  const contact = useStore((s) => s.enrichedContacts.main)
  const enriched = useStore(isEnriched)
  const setSelected = useStore((s) => s.setSelected)
  const togglePanel = useStore((s) => s.togglePanel)
  const fgRef = useRef()
  const cacheRef = useRef(new Map())

  const onNodeClick = (n) => {
    if (n.id === 'email') return togglePanel('email')
    setSelected({ id: n.id, type: n.type, label: n.label })
  }

  const visible = ['ENRICHING', 'ENRICHED', 'EMAIL_SENT'].includes(phase)

  // Séquenceur : UN élément à la fois, au rythme respiré de STEP_DELAYS.
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!visible) {
      setStep(0)
      cacheRef.current.clear()
      return
    }
    const cap = intel ? TOTAL_STEPS : 5
    let cancelled = false
    let timer
    const tick = (s) => {
      if (cancelled || s >= cap) return
      timer = setTimeout(() => {
        setStep(s + 1)
        tick(s + 1)
      }, STEP_DELAYS[s] ?? 800)
    }
    setStep((s) => {
      tick(s)
      return s
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [visible, intel])

  const data = useMemo(
    () => buildGraph({ intel, contact, step, cache: cacheRef.current }),
    [intel, contact, step],
  )

  // Le bandeau d'info : ce que la bulle qui vient de naître EST.
  const notice = useMemo(() => noticeFor(step, intel, contact), [step, intel, contact])

  // Caméra FIXE : un seul cadrage, calculé pour la composition finale.
  useEffect(() => {
    const fg = fgRef.current
    if (!fg || !visible) return
    const t = setTimeout(() => {
      const k = Math.min(window.innerWidth / EXTENT.w, window.innerHeight / EXTENT.h) * 0.92
      fg.centerAt(EXTENT.cx, EXTENT.cy, 0)
      fg.zoom(k, 0)
    }, 60)
    return () => clearTimeout(t)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'absolute', inset: 0, background: '#0a0c10' }}
        >
          <ForceGraph2D
            ref={fgRef}
            graphData={data}
            backgroundColor="#0a0c10"
            nodeLabel={() => ''}
            onNodeClick={onNodeClick}
            enableNodeDrag={false}
            linkColor={(l) => linkAlpha(l)}
            linkWidth={(l) => (l.strong ? 1.6 : 0.7)}
            linkDirectionalParticles={(l) => (l.live ? 2 : 0)}
            linkDirectionalParticleColor={() => CYAN}
            linkDirectionalParticleWidth={2.2}
            cooldownTicks={0}
            nodeCanvasObject={(node, ctx, scale) => drawNode(node, ctx, scale)}
            nodePointerAreaPaint={(node, color, ctx) => {
              ctx.fillStyle = color
              ctx.beginPath()
              ctx.arc(node.x, node.y, node.r + 8, 0, 2 * Math.PI)
              ctx.fill()
            }}
          />

          {/* Légende — le système de couleurs, lisible d'un coup d'œil */}
          <div
            className="glass"
            style={{
              position: 'absolute',
              right: 24,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '12px 14px',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#4b5563', marginBottom: 8 }}>
              Legend
            </div>
            {LEGEND.map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2.5px 0' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Bandeau synchronisé : chaque naissance est annoncée clairement */}
          <div
            style={{
              position: 'absolute',
              top: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          >
            <AnimatePresence mode="wait">
              {notice && (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.35 }}
                  className="glass"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '9px 16px',
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: notice.color,
                      boxShadow: `0 0 8px ${notice.color}`,
                    }}
                  />
                  <span style={{ color: '#6b7280', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {notice.tag}
                  </span>
                  <span style={{ color: '#e5e7eb' }}>{notice.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Le message lié à chaque pas de la chorégraphie.
function noticeFor(step, intel, contact) {
  const sig = (i) => intel?.sillage?.signals?.[i]
  const prom = (i) => intel?.insights?.promesses?.[i]
  const stakeholders = intel?.stakeholders ?? []
  const target = stakeholders.find((p) => p.status === 'unknown_target')
  const known = stakeholders.filter((p) => p.status !== 'unknown_target' && p.status !== 'committee').slice(0, 2)
  const committee = stakeholders.find((p) => p.status === 'committee')
  const co = contact?.details?.company
  switch (step) {
    case 1:
      return co ? { tag: 'Account', text: `${co.name} · ${co.industry ?? ''}`, color: '#e5e7eb' } : null
    case 2:
      return { tag: 'Source', text: 'Latest meeting · recorded & transcribed', color: '#94a3b8' }
    case 3:
      return known[0] ? { tag: 'Stakeholder', text: `${known[0].name} · ${known[0].role} · ${known[0].stance}`, color: CYAN } : null
    case 4:
      return known[1] ? { tag: 'Stakeholder', text: `${known[1].name} · ${known[1].role} · ${known[1].stance}`, color: CYAN } : null
    case 5:
      return target ? { tag: 'Unknown', text: `"${target.name.split(' ')[0]}" · ${target.role} — searching…`, color: GREY } : null
    case 6:
    case 7:
    case 8:
    case 9: {
      const s = sig(step - 6)
      return s ? { tag: `Sillage · ${s.recency}`, text: s.text, color: '#a78bfa' } : null
    }
    case 10:
      return contact
        ? {
            tag: contact.isLive ? 'FullEnrich · LIVE' : 'FullEnrich',
            text: `Identified: ${contact.name} · ${contact.email}`,
            color: '#4ade80',
          }
        : null
    case 11:
    case 12: {
      const p = prom(step - 11)
      return p ? { tag: 'Commitment', text: `${p.text} · ${p.owner}`, color: '#fbbf24' } : null
    }
    case 13:
      return { tag: 'Ready', text: `Follow-up drafted and attached to ${contact?.name?.split(' ')[0] ?? 'the contact'}`, color: '#34d399' }
    case 14:
      return committee
        ? { tag: 'FullEnrich · committee', text: `Also mapped: ${committee.name} · ${committee.role} — signs above ${target?.name?.split(' ')[0] ?? 'the buyer'}`, color: '#4ade80' }
        : null
    default:
      return null
  }
}

// ── Chorégraphie : UN élément par pas, positions désignées, générique compte ─
// 1 compte · 2 réunion · 3-4 connus · 5 l'inconnu (gris, pulse)
// 6-9 signaux un à un · 10 IDENTIFICATION (temps fort) · 11-12 engagements
// 13 la relance s'accroche à l'inconnu.
function buildGraph({ intel, contact, step, cache }) {
  const nodes = []
  const links = []

  const add = (spec, parentId) => {
    let n = cache.get(spec.id)
    if (!n) {
      const [tx, ty] = POS[spec.id] ?? [0, 0]
      const parentPos = parentId ? POS[parentId] : null
      const [sx, sy] = parentPos ?? [tx, ty]
      n = {
        r: 5,
        ...spec,
        born: Date.now(),
        seed: Math.random() * Math.PI * 2,
        sx,
        sy,
        tx,
        ty,
        x: sx,
        y: sy,
        fx: sx,
        fy: sy,
      }
      cache.set(spec.id, n)
    } else {
      const { born, seed, x, y, fx, fy, sx, sy, tx, ty, ...rest } = spec
      Object.assign(n, rest) // label/état peuvent évoluer (l'inconnu s'allume)
    }
    nodes.push(n)
    return n
  }
  const link = (source, target, opts = {}) => links.push({ source, target, ...opts })

  const stakeholders = intel?.stakeholders ?? []
  const targetSt = stakeholders.find((p) => p.status === 'unknown_target')
  const known = stakeholders.filter((p) => p.status !== 'unknown_target' && p.status !== 'committee').slice(0, 2)
  const committeeSt = stakeholders.find((p) => p.status === 'committee')
  const accountName = contact?.details?.company?.name ?? 'Account'

  if (step >= 1) add({ id: 'account', label: accountName, type: 'account', r: 9 })
  if (step >= 2) {
    add({ id: 'meeting', label: 'Latest meeting', type: 'event', r: 5.5 }, 'account')
    link('account', 'meeting', { strong: true })
  }
  if (step >= 3 && known[0]) {
    add({ id: 'p0', label: known[0].name, type: 'person', r: 6.5 }, 'meeting')
    link('meeting', 'p0', { strong: true })
  }
  if (step >= 4 && known[1]) {
    add({ id: 'p1', label: known[1].name, type: 'person', r: 6.5 }, 'meeting')
    link('meeting', 'p1', { strong: true })
  }

  const lit = Boolean(contact) && step >= 10
  if (step >= 5) {
    const prev = cache.get('target')
    add(
      {
        id: 'target',
        label: lit ? contact.name : `? · ${targetSt?.role ?? 'Unknown'}`,
        type: 'person',
        r: 8,
        grey: !lit,
        pulse: !lit,
        isLive: lit && contact.isLive,
        lit: lit ? (prev?.lit ?? Date.now()) : null,
      },
      'meeting',
    )
    link('meeting', 'target')
  }

  // 6-9 : les signaux Sillage, un à un.
  const signals = intel?.sillage?.signals ?? []
  signals.slice(0, Math.max(0, step - 5)).forEach((s, i) => {
    const parent = i === 0 ? 'target' : 'account'
    add({ id: `sig${i}`, label: `${s.recency} · ${short(s.text, 34)}`, type: 'signal', r: 4.5 }, parent)
    link(parent, `sig${i}`, { live: true })
  })

  // 10 : l'identification — un pas rien que pour elle.
  if (lit) link('target', 'account', { strong: true, live: contact.isLive })

  // 11-12 : les engagements, un par un.
  const proms = intel?.insights?.promesses ?? []
  proms.slice(0, Math.max(0, step - 10)).forEach((p, i) => {
    add({ id: `prom${i}`, label: short(p.text, 30), type: 'promise', r: 4.5 }, 'meeting')
    link('meeting', `prom${i}`)
  })

  // 13 : la relance s'accroche à l'inconnu identifié.
  if (step >= 13 && contact) {
    add({ id: 'email', label: 'Follow-up ready ✉', type: 'email', r: 6 }, 'target')
    link('target', 'email', { strong: true, live: true })
  }

  // 14 : le comité — l'agent remonte AU-DESSUS de Marc (son manager, le CRO),
  // aussi identifié par FullEnrich. Montre que l'agent mappe tout le board.
  if (step >= 14 && committeeSt) {
    add({ id: 'p2', label: committeeSt.name, type: 'person', r: 6.5, isLive: true }, 'target')
    link('target', 'p2', { strong: true, live: true })
  }

  return { nodes, links }
}

// ── Rendu (halo Obsidian + naissance + flottement discret) ───────────────────
// Système de couleurs structuré — une couleur par type, toutes distinctes.
const COLORS = {
  account: '#e5e7eb', // neutre : l'entreprise
  person: '#22d3ee', // cyan : les personnes
  event: '#94a3b8', // ardoise : les réunions/sources
  signal: '#a78bfa', // violet : les signaux Sillage
  promise: '#fbbf24', // ambre : les engagements
  email: '#34d399', // émeraude : les actions prêtes (follow-up)
}
const LEGEND = [
  { color: COLORS.person, label: 'Person' },
  { color: GREY, label: 'Unidentified' },
  { color: COLORS.account, label: 'Account' },
  { color: COLORS.event, label: 'Meeting' },
  { color: COLORS.signal, label: 'Sillage signal' },
  { color: COLORS.promise, label: 'Commitment' },
  { color: COLORS.email, label: 'Action ready' },
]

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
// Légère élasticité à l'arrivée (sans excès) — organique, pas mécanique.
const easeOutBackSoft = (t) => {
  const c = 1.25
  const u = t - 1
  return 1 + (c + 1) * u * u * u + c * u * u
}

function drawNode(node, ctx, scale) {
  const color = node.grey ? GREY : COLORS[node.type] ?? CYAN
  const now = Date.now()

  const age = now - (node.born ?? 0)
  const p = Math.min(1, age / BIRTH_MS)
  const birth = easeOutCubic(p)
  if (birth <= 0.02) return

  // Voyage : du parent vers sa place (le lien suit, node.x/y mutés).
  const travel = easeOutBackSoft(p)
  node.x = node.fx = (node.sx ?? node.tx) + ((node.tx ?? 0) - (node.sx ?? 0)) * travel
  node.y = node.fy = (node.sy ?? node.ty) + ((node.ty ?? 0) - (node.sy ?? 0)) * travel

  // Flottement discret : la toile respire, sans jamais partir en vrille.
  const wob = Math.sin(now / 1100 + (node.seed ?? 0))
  const x = node.x + wob * 1.6
  const y = node.y + Math.cos(now / 1300 + (node.seed ?? 0)) * 1.6

  let flash = 0
  if (node.lit) {
    const fa = (now - node.lit) / 1200
    if (fa < 1) flash = (1 - fa) * 0.9
  }

  const pulse = node.pulse ? 1 + 0.22 * Math.sin(now / 250) : 1
  const k = birth * pulse

  ctx.globalAlpha = birth

  ctx.beginPath()
  ctx.arc(x, y, node.r * (1.55 + flash * 1.6) * k, 0, 2 * Math.PI)
  ctx.fillStyle = node.grey ? 'rgba(138,143,152,0.10)' : hexA(color, 0.14 + flash * 0.25)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y, node.r * k, 0, 2 * Math.PI)
  ctx.fillStyle = node.grey ? 'rgba(138,143,152,0.55)' : color
  ctx.fill()
  if (node.isLive) {
    ctx.beginPath()
    ctx.arc(x + node.r * 0.9, y - node.r * 0.9, 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#4ade80'
    ctx.fill()
  }
  // Le label arrive APRÈS la bulle (300ms de retard) — moins mécanique.
  const labelAlpha = Math.max(0, Math.min(1, (age - 300) / 700))
  if (labelAlpha > 0.02) {
    ctx.globalAlpha = labelAlpha
    const fontSize = Math.max(11 / scale, 3)
    ctx.font = `${node.type === 'person' || node.type === 'account' ? 600 : 400} ${fontSize}px ui-sans-serif, system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = node.grey ? '#9ca3af' : '#e5e7eb'
    ctx.fillText(node.label, x, y + node.r * 1.6 + 3)
  }

  ctx.globalAlpha = 1
}

function linkAlpha(l) {
  const born = Math.max(l.source?.born ?? 0, l.target?.born ?? 0)
  const t = Math.min(1, (Date.now() - born) / BIRTH_MS)
  return `rgba(148,163,184,${0.25 * easeOutCubic(t)})`
}

const short = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const hexA = (hex, a) => {
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16))
  return `rgba(${r},${g},${b},${a})`
}
