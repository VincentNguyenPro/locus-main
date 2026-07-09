import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { enrichContact, type CleanContact } from './fullenrich.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

type RunInput = {
  account?: string
  transcript?: string
  // contact ciblé pour l'appel live (la silhouette grise)
  target?: { first_name: string; last_name: string; company_name: string; domain: string }
}

type RunResult = {
  stakeholders: any[]
  contact: any
  email: { subject: string; body: string }
  sillage?: any
  insights?: any
  mode: 'fixtures' | 'live'
}

/**
 * Orchestration de la démo.
 *
 * Deux chemins, choisis par env :
 *  - USE_FIXTURES=1  -> renvoie fixtures/demo.json (défaut sûr pour la scène).
 *  - sinon           -> Claude lit le transcript et appelle les MCP FullEnrich
 *                       + Sillage comme outils (mcp_toolset). L'appel FullEnrich
 *                       REST reste dispo comme chemin de secours contrôlé.
 *
 * Invariant : TOUT passe par sanitize() avant de partir vers le front —
 * jamais de payload brut (ni Claude, ni FullEnrich).
 */
export async function runAgent(input: RunInput = {}): Promise<RunResult> {
  const account = input.account ?? 'sephora'
  const fixtures = loadFixtures(account)

  if (process.env.USE_FIXTURES === '1' || !process.env.ANTHROPIC_API_KEY) {
    // L'UNIQUE appel live de la scène (compte héros uniquement) : le contact
    // FullEnrich pré-chauffé est mergé dans les fixtures.
    const live = account === 'sephora' ? await getPrewarmed(15_000) : null
    console.log(`[agent] account=${account} mode=fixtures${live ? ' (+contact FullEnrich live)' : ''}`)
    return sanitize(live ? { contact: live } : {}, fixtures, 'fixtures')
  }

  console.log('[agent] mode=live')
  const transcript = input.transcript ?? fixtures.transcript

  // Les MCP branchés par URL côté Anthropic — Claude les appelle lui-même.
  // Chaque serveur n'est inclus QUE si son URL/token est présent : un Sillage
  // absent dégrade en FullEnrich-only au lieu de tuer le run (fix review #5).
  const mcpServers: any[] = []
  if (process.env.FULLENRICH_TOKEN) {
    mcpServers.push({
      type: 'url',
      url: process.env.FULLENRICH_MCP_URL ?? 'https://mcp.fullenrich.com/mcp',
      name: 'fullenrich',
      authorization_token: process.env.FULLENRICH_TOKEN,
    })
  }
  if (process.env.SILLAGE_MCP_URL) {
    mcpServers.push({
      type: 'url',
      url: process.env.SILLAGE_MCP_URL,
      name: 'sillage',
      authorization_token: process.env.SILLAGE_TOKEN,
    })
  }

  const message = await getClient().beta.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
    max_tokens: 2000,
    mcp_servers: mcpServers as any,
    tools: mcpServers.map((s) => ({ type: 'mcp_toolset', mcp_server_name: s.name })) as any,
    betas: [process.env.MCP_BETA ?? 'mcp-client-2025-11-20'],
    messages: [{ role: 'user', content: buildPrompt(transcript) }],
  })

  const parsed = parseAgentOutput(message)

  // Chemin live contrôlé : si Claude n'a pas produit de contact exploitable,
  // on complète avec le prewarm puis l'appel REST direct (null si échec → fixture gagne).
  if (!parsed.contact) {
    parsed.contact =
      (await getPrewarmed(15_000)) ?? (input.target ? await enrichContact(input.target) : null)
  }

  return sanitize(parsed, fixtures, 'live')
}

// ── Q&A : interroger l'agent sur le compte ───────────────────────────────────
// Fixtures : petite récupération par mots-clés dans les données du compte.
// Live : Claude + MCP (mêmes serveurs que runAgent), réponse courte.
export async function answerQuestion(question: string, account = 'sephora'): Promise<{ answer: string; mode: string }> {
  const fixtures = loadFixtures(account)

  if (process.env.USE_FIXTURES === '1' || !process.env.ANTHROPIC_API_KEY) {
    return { answer: cannedAnswer(question, fixtures), mode: 'fixtures' }
  }

  const mcpServers: any[] = []
  if (process.env.FULLENRICH_TOKEN) {
    mcpServers.push({
      type: 'url',
      url: process.env.FULLENRICH_MCP_URL ?? 'https://mcp.fullenrich.com/mcp',
      name: 'fullenrich',
      authorization_token: process.env.FULLENRICH_TOKEN,
    })
  }
  if (process.env.SILLAGE_MCP_URL) {
    mcpServers.push({
      type: 'url',
      url: process.env.SILLAGE_MCP_URL,
      name: 'sillage',
      authorization_token: process.env.SILLAGE_TOKEN,
    })
  }

  const message = await getClient().beta.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
    max_tokens: 600,
    mcp_servers: mcpServers as any,
    tools: mcpServers.map((s) => ({ type: 'mcp_toolset', mcp_server_name: s.name })) as any,
    betas: [process.env.MCP_BETA ?? 'mcp-client-2025-11-20'],
    messages: [
      {
        role: 'user',
        content: [
          'You are the Sephora account agent. Context (transcript + intel):',
          JSON.stringify({
            transcript: fixtures.transcript,
            stakeholders: fixtures.stakeholders,
            insights: fixtures.insights,
            sillage: fixtures.sillage,
            contact: fixtures.contact,
          }),
          '',
          'Answer in 2-4 sentences, in English, concrete and actionable.',
          'If the question needs fresh data, use the FullEnrich/Sillage tools.',
          '',
          `Question: ${question}`,
        ].join('\n'),
      },
    ],
  })

  const text = (message?.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim()
  return { answer: text || cannedAnswer(question, fixtures), mode: 'live' }
}

// Honest retrieval from the fixtures (no invention).
function cannedAnswer(q: string, f: any): string {
  const s = q.toLowerCase()
  if (/(budget|decid|decision|block|approv|sign.?off)/.test(s))
    return `${f.contact.name} (${f.contact.role}) owns the budget call - he was not in the meeting. ${f.insights.angle}`
  if (/(angle|approach|convince|pitch|strategy)/.test(s)) return f.insights.angle
  if (/(signal|news|recent|update|new|happen)/.test(s))
    return f.sillage.signals.map((x: any) => `• ${x.recency} - ${x.text}`).join('\n')
  if (/(commit|promise|action|todo|next step|follow)/.test(s))
    return f.insights.promesses.map((p: any) => `◻ ${p.text} (${p.owner}, ${p.due})`).join('\n')
  if (new RegExp(`(${f.contact.name.split(' ')[0].toLowerCase()}|contact|email|mail|phone|reach)`).test(s))
    return `${f.contact.name}, ${f.contact.role}. Email: ${f.contact.email} · Phone: ${f.contact.phone}. Signal: ${f.contact.signal}.`
  if (/(who|stakeholder|present|meeting|attend)/.test(s))
    return f.stakeholders.map((p: any) => `• ${p.name} - ${p.role} (${p.stance})`).join('\n')
  return `Account summary: ${f.insights.angle} Next action: ${f.insights.promesses[0].text}.`
}

// ── Prewarm : l'enrichissement FullEnrich se lance AVANT le moment démo ──────
// (POST /prewarm à l'entrée dans l'ascenseur ; le run le récupère, déjà prêt.)
let prewarmPromise: Promise<CleanContact | null> | null = null

export function startPrewarm(target?: RunInput['target']): boolean {
  if (prewarmPromise) return false // déjà lancé (garde StrictMode/double-clic)
  const t = target ?? loadFixtures().target
  console.log('[prewarm] enrichissement FullEnrich lancé pour', t?.first_name, t?.last_name)
  prewarmPromise = enrichContact(t).then((r) => {
    console.log('[prewarm]', r ? `prêt (isLive, ${r.email ?? r.phone})` : 'aucune donnée live → fixture')
    // Échec = slot libéré : un prochain POST /prewarm peut retenter (jour J).
    if (!r) prewarmPromise = null
    return r
  })
  return true
}

async function getPrewarmed(capMs: number): Promise<CleanContact | null> {
  if (!prewarmPromise) return null
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), capMs).unref())
  return Promise.race([prewarmPromise, timeout])
}

// ── Normalisation au bord du job : le front ne voit que des formes garanties ──
function sanitize(parsed: any, fixtures: any, mode: RunResult['mode']): RunResult {
  const fc = fixtures.contact
  const c = parsed?.contact && typeof parsed.contact === 'object' ? parsed.contact : null
  const liveDetails = c?.details && typeof c.details === 'object' ? c.details : null
  const contact = {
    id: 'main', // clé fixe : ContactCard lit enrichedContacts.main (fix review #3)
    name: str(c?.name) ?? fc.name,
    role: str(c?.role) ?? str(liveDetails?.headline) ?? fc.role,
    email: str(c?.email) ?? fc.email,
    phone: str(c?.phone) ?? fc.phone,
    status: 'FINISHED',
    isLive: Boolean(str(c?.email)),
    signal: str(c?.signal) ?? str(parsed?.sillage?.signal) ?? fc.signal,
    // Le dossier : live si FullEnrich a livré, sinon fixture — champ par champ
    // (un null live n'écrase JAMAIS une donnée fixture soignée).
    details: {
      emails: liveDetails?.emails?.length ? liveDetails.emails : fc.details.emails,
      phones: liveDetails?.phones?.length ? liveDetails.phones : fc.details.phones,
      headline: str(liveDetails?.headline) ?? fc.details.headline,
      location: str(liveDetails?.location) ?? fc.details.location,
      linkedin: str(liveDetails?.linkedin) ?? fc.details.linkedin,
      company: liveDetails?.company ?? fc.details.company,
    },
  }
  const e = parsed?.email
  const email = e && typeof e === 'object' && str(e.subject) && str(e.body) ? e : fixtures.email
  const stakeholders =
    Array.isArray(parsed?.stakeholders) && parsed.stakeholders.length
      ? parsed.stakeholders
      : fixtures.stakeholders
  const sillage = {
    ...fixtures.sillage,
    ...(parsed?.sillage && typeof parsed.sillage === 'object' ? parsed.sillage : {}),
    signals: Array.isArray(parsed?.sillage?.signals) && parsed.sillage.signals.length
      ? parsed.sillage.signals
      : fixtures.sillage.signals,
  }
  const insights =
    parsed?.insights && typeof parsed.insights === 'object' ? parsed.insights : fixtures.insights
  return { stakeholders, contact, email, sillage, insights, mode }
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v : undefined

function buildPrompt(transcript: string): string {
  return [
    'You are a sales-preparation agent. Here is the transcript of a sales meeting.',
    'Identify the stakeholders (known and mentioned-but-unknown), detect the sales angle',
    'and the open commitments, then:',
    '1. Use the FullEnrich tool to enrich the unknown contact (verified email, phone, role).',
    '2. If the Sillage tool is available, fetch the most recent signal on this contact/account.',
    '3. Write a personalized follow-up email, ready to send.',
    '',
    'Answer ONLY with a JSON block, exactly this schema:',
    '{"stakeholders":[{"name":"...","role":"...","status":"known|unknown_target","stance":"..."}],',
    ' "contact":{"id":"main","name":"...","role":"...","email":"...","phone":"...","signal":"..."},',
    ' "sillage":{"signal":"...","signals":[{"text":"...","recency":"...","type":"..."}]},',
    ' "insights":{"angle":"...","promesses":["..."]},',
    ' "email":{"subject":"...","body":"..."}}',
    '',
    '--- TRANSCRIPT ---',
    transcript,
  ].join('\n')
}

function parseAgentOutput(message: any): any {
  const text = (message?.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return {}
  try {
    return JSON.parse(match[0])
  } catch {
    return {}
  }
}

// Fixtures par compte : sephora (demo.json), loreal, chanel. Cache module.
const FILES: Record<string, string> = { sephora: 'demo.json', loreal: 'loreal.json', chanel: 'chanel.json' }
const fixturesCache = new Map<string, any>()
function loadFixtures(account = 'sephora'): any {
  const key = FILES[account] ? account : 'sephora'
  if (!fixturesCache.has(key)) {
    fixturesCache.set(key, JSON.parse(readFileSync(join(__dirname, 'fixtures', FILES[key]), 'utf-8')))
  }
  return fixturesCache.get(key)
}

// Sous-ensemble exposable avant le run (deal room + directory).
export function loadPublicFixtures(account = 'sephora'): any {
  return loadFixtures(account)
}

// Client Anthropic : singleton paresseux (jamais construit en mode fixtures).
let client: Anthropic | null = null
const getClient = () => (client ??= new Anthropic())
