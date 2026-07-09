import { create } from 'zustand'
import { playBriefing, stopBriefing } from './briefing.js'

// Machine à états — la string `phase` synchronise caméra, HUD, audio, silhouette.
// LOBBY → ELEVATOR → ROOM_OPEN → ENRICHING → ENRICHED → EMAIL_SENT
// (ELEVATOR et ROOM_OPEN sont câblées à l'étape « ascenseur » — multiplicateur.)
export const useStore = create((set, get) => ({
  phase: 'INTRO', // l'ouverture éditoriale ; Reset ramène à LOBBY (boucles démo rapides)
  currentAccount: 'sephora', // la porte qu'on a franchie
  enrichedContacts: {}, // { main: cleanData } — clé fixe, garantie par le serveur
  emailDraft: null,
  intel: null, // { stakeholders, sillage, insights, mode } — tout ce que l'agent sait
  panels: { intel: false, email: false, qa: false }, // ouverts à la demande (anti-surcharge)
  // intel et qa partagent l'emplacement gauche → mutuellement exclusifs.
  togglePanel: (name) =>
    set((s) => {
      const next = { ...s.panels, [name]: !s.panels[name] }
      if (name === 'intel' && next.intel) next.qa = false
      if (name === 'qa' && next.qa) next.intel = false
      return { panels: next }
    }),
  qaHistory: [], // [{ q, a, mode }]
  askAgent: async (question) => {
    try {
      const r = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, account: get().currentAccount }),
      }).then((res) => res.json())
      set((s) => ({ qaHistory: [...s.qaHistory, { q: question, a: r.answer, mode: r.mode }] }))
    } catch {
      set((s) => ({
        qaHistory: [...s.qaHistory, { q: question, a: 'Backend unreachable.', mode: 'error' }],
      }))
    }
  },
  selected: null, // nœud du graphe cliqué → panneau détail
  setSelected: (selected) => set({ selected }),
  emailSentReal: false, // true si Resend a réellement envoyé (honnêteté Q&A)
  error: null,
  _runSeq: 0, // invalide les runs en vol au Reset (garde anti-course)

  setPhase: (phase) => set({ phase }),
  setContact: (id, data) =>
    set((s) => ({ enrichedContacts: { ...s.enrichedContacts, [id]: data } })),

  // Reset = transition machine complète : purge l'état, coupe la voix,
  // ET invalide le poll en vol.
  reset: () => {
    stopBriefing()
    set((s) => ({
      phase: 'LOBBY',
      enrichedContacts: {},
      emailDraft: null,
      intel: null,
      panels: { intel: false, email: false, qa: false },
      selected: null,
      qaHistory: [],
      emailSentReal: false,
      error: null,
      _runSeq: s._runSeq + 1,
    }))
  },

  // L'ascenseur (multiplicateur) : LOBBY → ELEVATOR (voix + prewarm) → ROOM_OPEN.
  enterBuilding: async (accountId) => {
    const seq = get()._runSeq + 1
    const account = typeof accountId === 'string' ? accountId : 'sephora'
    set({ _runSeq: seq, phase: 'ELEVATOR', error: null, currentAccount: account })
    fetch('/prewarm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {})
    if (account === 'sephora') playBriefing() // le briefing vocal est écrit pour Sephora
    await sleep(5000) // durée de la montée — la caméra voyage pendant ce temps
    if (get()._runSeq === seq && get().phase === 'ELEVATOR') set({ phase: 'ROOM_OPEN' })
  },

  // Envoi réel via Resend (multiplicateur) — l'échec reste silencieux et honnête.
  sendEmail: async () => {
    const email = get().emailDraft
    set({ phase: 'EMAIL_SENT' })
    try {
      const r = await fetch('/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email ?? {}),
      }).then((res) => res.json())
      set({ emailSentReal: Boolean(r.sent) })
    } catch {
      set({ emailSentReal: false })
    }
  },

  // Lance le run backend puis poll toutes les 1s jusqu'à un état terminal.
  // Borné (90s max), tolérant aux pannes : jamais bloqué en ENRICHING.
  runAgent: async (payload) => {
    const seq = get()._runSeq + 1
    set({ _runSeq: seq, phase: 'ENRICHING', error: null })
    const alive = () => get()._runSeq === seq
    const fail = (message) => {
      if (alive()) set({ phase: 'LOBBY', error: message })
    }

    let jobId
    try {
      const start = await fetch('/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: get().currentAccount, ...(payload ?? {}) }),
      }).then((r) => r.json())
      jobId = start.jobId
    } catch {
      return fail('Backend unreachable (:8787)')
    }
    if (!jobId) return fail('Invalid server response')

    for (let i = 0; i < 90 && alive(); i++) {
      await sleep(1000)
      let job
      try {
        job = await fetch(`/run/${jobId}`).then((r) => r.json())
      } catch {
        continue // panne réseau transitoire : on retente au tick suivant
      }
      if (!alive()) return
      if (job.status === 'done') {
        if (job.contact) get().setContact('main', job.contact)
        set({
          emailDraft: job.email ?? null,
          intel: {
            stakeholders: job.stakeholders ?? [],
            sillage: job.sillage ?? null,
            insights: job.insights ?? null,
            mode: job.mode ?? 'fixtures',
          },
          phase: 'ENRICHED',
        })
        return
      }
      if (job.status === 'error') return fail(job.message ?? 'Agent error')
    }
    fail('Timed out (90s)')
  },
}))

// Sélecteur partagé : « le moment d'enrichissement a eu lieu » — une seule
// définition pour Room, ContactCard, EmailPanel (et suivants).
export const isEnriched = (s) => s.phase === 'ENRICHED' || s.phase === 'EMAIL_SENT'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
