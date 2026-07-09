import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store.js'

// L'ouverture éditoriale — le design de duhan (noir, extralight, mono labels,
// glow qui suit la souris, scroll-snap). Trois écrans, puis on entre.
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'
const TEXT_PRIMARY = '#ffffff'
const TEXT_SECONDARY = '#dcdce2'
const TEXT_MUTED = '#adadb8'

export default function Landing() {
  const phase = useStore((s) => s.phase)
  const setPhase = useStore((s) => s.setPhase)
  const glowRef = useRef()

  if (phase !== 'INTRO') return null

  const onMouseMove = (e) => {
    if (!glowRef.current) return
    const x = (e.clientX / window.innerWidth) * 100
    const y = (e.clientY / window.innerHeight) * 100
    glowRef.current.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.045) 0%, rgba(0,0,0,0) 70%)`
  }

  return (
    <motion.div
      exit={{ opacity: 0 }}
      onMouseMove={onMouseMove}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: '#000',
        color: '#e2e2e2',
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
      }}
    >
      <div ref={glowRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />

      {/* 00 — Thesis */}
      <Section>
        <MonoLabel dim>Locus // Agentic GTM</MonoLabel>
        <Display>
          A deal doesn't move
          <br />
          <span style={{ color: TEXT_MUTED, fontStyle: 'italic' }}>until the decision-maker is in the room.</span>
        </Display>
        <p style={{ color: TEXT_SECONDARY, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 300, maxWidth: 420, margin: '0 auto' }}>
          The person who signs is rarely the person in the meeting.
        </p>
      </Section>

      {/* 01 — The Closed Door */}
      <Section>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: 1, height: 256, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }} />
        </div>
        <MonoLabel>01 // The Missing Signature</MonoLabel>
        <Display>
          Locus finds
          <br />
          <span style={{ color: TEXT_PRIMARY }}>them.</span>
        </Display>
        <p style={{ color: TEXT_SECONDARY, fontSize: 17, fontWeight: 300, lineHeight: 1.6, maxWidth: 620, margin: '0 auto' }}>
          It reads your meetings, identifies the decision-maker who wasn't there, maps everyone else who
          matters, and writes the follow-up — so your rep walks in already prepared, not still preparing.
        </p>
      </Section>

      {/* 02 — Threshold */}
      <Section>
        <h3
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 200,
            letterSpacing: '-0.03em',
            fontStyle: 'italic',
            color: TEXT_SECONDARY,
            marginBottom: 128,
          }}
        >
          The rooms are ready.
        </h3>
        <div style={{ position: 'absolute', bottom: 64, left: '50%', transform: 'translateX(-50%)' }}>
          <button
            onClick={() => setPhase('LOBBY')}
            className="landing-cta"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              color: '#e2e2e2',
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5em', color: TEXT_SECONDARY }}>
              Resolve protocol
            </span>
            <span style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 12 }}>
              Enter the building <span className="landing-arrow">→</span>
            </span>
            <span className="landing-line" />
          </button>
        </div>
      </Section>
    </motion.div>
  )
}

function Section({ children }) {
  return (
    <section
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 64px',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          height: '100%',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </section>
  )
}

function MonoLabel({ children, dim }) {
  return (
    <p
      style={{
        fontFamily: MONO,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.6em',
        color: dim ? TEXT_MUTED : TEXT_SECONDARY,
        marginBottom: 64,
      }}
    >
      {children}
    </p>
  )
}

function Display({ children }) {
  return (
    <h1
      style={{
        fontSize: 'clamp(2.5rem, 8vw, 6.5rem)',
        lineHeight: 0.95,
        letterSpacing: '-0.04em',
        fontWeight: 200,
        color: '#fff',
        marginBottom: 48,
      }}
    >
      {children}
    </h1>
  )
}
