// Voix du briefing d'ascenseur.
// Priorité : /audio/briefing.wav (pré-généré Gradium). Fallback : speechSynthesis.
const TEXT =
  'Briefing. Sephora meeting, room three. Claire Fontaine, digital director. ' +
  'Julien Reyes, C R M. One decision-maker mentioned but unknown: Marc, head of sales. ' +
  'Objective: identify Marc, and get his budget go before September.'

let currentAudio = null

export function playBriefing() {
  stopBriefing()
  const audio = new Audio('/audio/briefing.wav')
  currentAudio = audio
  audio.play().catch(() => {
    // Pas de wav (ou autoplay bloqué) → synthèse vocale navigateur.
    try {
      const u = new SpeechSynthesisUtterance(TEXT)
      u.lang = 'en-US'
      u.rate = 1.05
      window.speechSynthesis.speak(u)
    } catch {
      /* silencieux : la voix est un multiplicateur, jamais bloquante */
    }
  })
}

export function stopBriefing() {
  currentAudio?.pause()
  currentAudio = null
  try {
    window.speechSynthesis.cancel()
  } catch {}
}
