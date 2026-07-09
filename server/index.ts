import 'dotenv/config' // charge server/.env AVANT tout le reste (fix review #1)
import express from 'express'
import crypto from 'node:crypto'
import { runAgent, startPrewarm, answerQuestion, loadPublicFixtures } from './agent.js'

const app = express()
app.use(express.json())

// Jobs en mémoire — pas de SSE/WebSocket, le front poll GET /run/:id toutes les 1s.
const jobs: Record<string, any> = {}
const JOB_TTL_MS = 10 * 60_000

app.post('/run', (req, res) => {
  const id = crypto.randomUUID()
  jobs[id] = { status: 'running' }
  runAgent(req.body)
    .then((r) => {
      // status APRÈS le spread : la sortie agent ne peut pas l'écraser (fix review #7)
      jobs[id] = { ...r, status: 'done' }
    })
    .catch((e) => {
      jobs[id] = { status: 'error', message: String(e) }
    })
    .finally(() => setTimeout(() => delete jobs[id], JOB_TTL_MS).unref())
  res.json({ jobId: id })
})

app.get('/run/:id', (req, res) => {
  // Job inconnu (redémarrage serveur, id périmé) = terminal pour le front,
  // jamais un 'unknown' que le polling attendrait à l'infini.
  res.json(jobs[req.params.id] ?? { status: 'error', message: 'unknown job (server restarted?)' })
})

// Q&A : question libre sur le compte (jury, présentateur). Réponse directe,
// avec timeout — jamais plus de 25s d'attente.
app.post('/ask', async (req, res) => {
  const question = String(req.body?.question ?? '').slice(0, 500)
  if (!question.trim()) return res.json({ answer: 'Ask a question about the account.', mode: 'none' })
  try {
    const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 25_000).unref())
    const r = await Promise.race([answerQuestion(question, String(req.body?.account ?? 'sephora')), timeout])
    res.json(r)
  } catch (e) {
    console.warn('[ask] échec:', String(e))
    res.json({ answer: 'The agent could not answer in time - try again.', mode: 'error' })
  }
})

// Pré-chauffage : à appeler ~30s avant le moment démo (entrée ascenseur).
// Idempotent — un seul enrichissement par vie du serveur (cible = fixtures.target par défaut).
app.post('/prewarm', (req, res) => {
  const started = startPrewarm(req.body?.target)
  res.json({ prewarming: started, alreadyStarted: !started })
})

// Envoi réel de la relance via Resend (multiplicateur).
// GARDE-FOU : destinataire = RESEND_TO uniquement (la boîte du présentateur),
// jamais l'email enrichi — on ne spamme pas de vraies personnes en démo.
app.post('/send-email', async (req, res) => {
  const key = process.env.RESEND_API_KEY
  const to = process.env.RESEND_TO
  const { subject, body } = req.body ?? {}
  if (!key || !to || !subject || !body) return res.json({ sent: false })
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Le Bâtiment Clients <onboarding@resend.dev>',
        to: [to],
        subject: String(subject),
        text: String(body),
      }),
    })
    const j: any = await r.json().catch(() => null)
    console.log('[resend]', r.ok ? `envoyé (${j?.id})` : `échec ${r.status}`)
    res.json({ sent: r.ok })
  } catch (e) {
    console.warn('[resend] erreur:', String(e))
    res.json({ sent: false })
  }
})

// Pre-run account data: the deal room (people, meeting) + the lobby directory.
// The demo shows WHO is in the room BEFORE the agent runs — no cold screen.
app.get('/account', (req, res) => {
  const f = loadPublicFixtures(String(req.query.name ?? 'sephora'))
  res.json({
    account: f.account,
    stakeholders: f.stakeholders,
    directory: loadPublicFixtures('sephora').directory,
  })
})

app.get('/health', (_req, res) => res.json({ ok: true }))

const PORT = 8787
app.listen(PORT, () => console.log(`[server] écoute sur http://localhost:${PORT}`))
