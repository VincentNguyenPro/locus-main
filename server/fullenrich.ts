// FullEnrich REST v2 — chemin live contrôlé pour l'unique appel scénarisé.
// L'agent utilise le MCP FullEnrich par défaut ; ce module sert quand on veut
// piloter précisément le timing (lancer l'enrichissement 30s avant le moment démo).
//
// Contrat : retourne un CleanContact UNIQUEMENT si des données live existent,
// sinon null — c'est agent.ts/sanitize() qui décide du fallback (fixture soignée),
// jamais ce module (fix review #6 : pas de contact fabriqué).

const BASE = 'https://app.fullenrich.com/api/v2/contact/enrich'

type Target = {
  first_name: string
  last_name: string
  company_name: string
  domain: string
}

export type CleanContact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  status: string
  isLive: true
  // Le dossier complet FullEnrich — tout ce que l'API livre, normalisé.
  details: {
    emails: { email: string; status: string }[]
    phones: { number: string }[]
    headline: string | null
    location: string | null
    linkedin: string | null
    company: { name: string; domain: string; industry: string | null; size: string | null } | null
  }
}

export async function enrichContact(t: Partial<Target> | undefined): Promise<CleanContact | null> {
  const token = process.env.FULLENRICH_TOKEN
  // Validation d'entrée : target vient de req.body, jamais confiance aveugle.
  if (!token || !t?.first_name || !t?.last_name || !t?.domain) return null

  try {
    const started = await fetch(`${BASE}/bulk`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Demo - ${t.first_name} ${t.last_name}`,
        data: [
          {
            first_name: t.first_name,
            last_name: t.last_name,
            company_name: t.company_name ?? '',
            domain: t.domain,
            enrich_fields: ['contact.work_emails', 'contact.phones'],
          },
        ],
      }),
    }).then((r) => r.json())

    const enrichmentId = started?.enrichment_id
    if (!enrichmentId) return null

    // Poll: CREATED -> IN_PROGRESS -> FINISHED (ou FAILED/CANCELED = terminal).
    // Mesuré en réel : ~30-35s. Fenêtre 80s — le prewarm tourne en fond, c'est gratuit.
    for (let i = 0; i < 40; i++) {
      const res = await fetch(`${BASE}/bulk/${enrichmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json())
      if (res?.status === 'FINISHED') return normalize(res, t as Target)
      if (res?.status === 'FAILED' || res?.status === 'CANCELED') return null
      await sleep(2000)
    }
    return null
  } catch (e) {
    console.warn('[fullenrich] échec, fallback fixture:', String(e))
    return null
  }
}

// Ne renvoie un contact que si l'API a livré au moins un email ou un téléphone.
// On capture TOUT ce que FullEnrich expose (défensif : chaque champ peut manquer).
function normalize(live: any, t: Target): CleanContact | null {
  const first = live?.data?.[0]
  const ci = first?.contact_info
  const profile = first?.profile ?? first?.social_profile
  const company = first?.company ?? profile?.company
  const email = ci?.most_probable_work_email?.email ?? null
  const phone = ci?.most_probable_phone?.number ?? null
  if (!email && !phone) return null
  return {
    id: 'main',
    name: `${t.first_name} ${t.last_name}`,
    email,
    phone,
    role: profile?.headline ?? null,
    status: 'FINISHED',
    isLive: true,
    details: {
      emails: (ci?.work_emails ?? [])
        .filter((e: any) => e?.email)
        .map((e: any) => ({ email: e.email, status: e.status ?? 'UNKNOWN' })),
      phones: (ci?.phones ?? [])
        .filter((p: any) => p?.number)
        .map((p: any) => ({ number: p.number })),
      headline: profile?.headline ?? null,
      location: profile?.location ?? null,
      linkedin: profile?.linkedin_url ?? profile?.url ?? null,
      company: company
        ? {
            name: company.name ?? t.company_name ?? '',
            domain: company.domain ?? t.domain,
            industry: company.industry ?? null,
            size: company.size ?? company.headcount ?? null,
          }
        : null,
    },
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
