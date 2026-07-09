import { useMemo } from 'react'

// La tour « Le Bâtiment Clients » — vue du LOBBY et pendant la montée.
// Low-poly sobre : boîte sombre + grille de fenêtres, certaines éclairées cyan
// (chaque fenêtre éclairée = un compte client vivant, c'est le pitch).
const FLOORS = 6
const COLS = 7
const W = 12
const H = 14
const D = 8

export default function Building(props) {
  // Motif de fenêtres déterministe (pas de Math.random : stable au re-render).
  const windows = useMemo(() => {
    const list = []
    for (let f = 0; f < FLOORS; f++) {
      for (let c = 0; c < COLS; c++) {
        const lit = (f * 7 + c * 3) % 5 < 2
        const x = -W / 2 + 1.4 + c * ((W - 2.8) / (COLS - 1))
        // Pas de fenêtre derrière l'entrée (z-fighting au rez-de-chaussée).
        if (f === 0 && Math.abs(x) < 1.9) continue
        list.push({ x, y: 1.6 + f * ((H - 3) / (FLOORS - 1)), lit })
      }
    }
    return list
  }, [])

  return (
    <group {...props}>
      {/* corps de la tour */}
      <mesh position={[0, H / 2, 0]}>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color="#1b2230" roughness={0.8} />
      </mesh>

      {/* fenêtres (façade avant) */}
      {windows.map((w, i) => (
        <mesh key={i} position={[w.x, w.y, D / 2 + 0.02]}>
          <planeGeometry args={[0.9, 0.6]} />
          <meshStandardMaterial
            color={w.lit ? '#22d3ee' : '#1e2430'}
            emissive={w.lit ? '#22d3ee' : '#000000'}
            emissiveIntensity={w.lit ? 1.6 : 0}
          />
        </mesh>
      ))}

      {/* enseigne : barre lumineuse au sommet (pas de police = zéro réseau) */}
      <mesh position={[0, H + 0.5, D / 2 - 1]}>
        <boxGeometry args={[W * 0.7, 0.35, 0.2]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2.2} />
      </mesh>

      {/* entrée */}
      <mesh position={[0, 1.1, D / 2 + 0.06]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshStandardMaterial color="#0a0c10" emissive="#22d3ee" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
}
