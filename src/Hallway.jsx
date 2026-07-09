import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from './store.js'
import { DOORS } from './layout.js'

// Le couloir des comptes — la première scène. Une porte par compte client,
// SEPHORA au fond. Lisible en une seconde : un couloir, des portes, des noms.
const W = 6 // largeur couloir
const H = 3.8 // hauteur
const END = -14 // mur du fond (la porte Sephora)

export default function Hallway() {
  return (
    <group>
      {/* sol + plafond */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, END / 2 + 2]}>
        <planeGeometry args={[W, -END + 8]} />
        <meshStandardMaterial color="#141922" roughness={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, END / 2 + 2]}>
        <planeGeometry args={[W, -END + 8]} />
        <meshStandardMaterial color="#0f1319" />
      </mesh>

      {/* murs latéraux */}
      <mesh position={[-W / 2, H / 2, END / 2 + 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[-END + 8, H]} />
        <meshStandardMaterial color="#1a212d" />
      </mesh>
      <mesh position={[W / 2, H / 2, END / 2 + 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[-END + 8, H]} />
        <meshStandardMaterial color="#1a212d" />
      </mesh>

      {/* lignes de lumière au plafond — profondeur + « léger » */}
      {[0, -4, -8, -12].map((z) => (
        <mesh key={z} position={[0, H - 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 0.18]} />
          <meshStandardMaterial color="#e5f6fa" emissive="#bfeff8" emissiveIntensity={1.6} />
        </mesh>
      ))}

      {/* mur du fond percé : 2 segments + linteau autour de la porte Sephora */}
      <EndWall />

      {/* LA porte Sephora (s'ouvre au passage) */}
      <SephoraDoor />

      {/* portes latérales (décor : les autres comptes) */}
      {DOORS.filter((d) => d.side).map((d) => (
        <SideDoor key={d.id} door={d} />
      ))}

      {/* éclairage du couloir */}
      <pointLight position={[0, H - 0.4, -4]} intensity={0.7} color="#dff8ff" />
      <pointLight position={[0, H - 0.4, -11]} intensity={0.7} color="#dff8ff" />
      <pointLight position={[0, 2.2, END + 1]} intensity={0.5} color="#22d3ee" />
    </group>
  )
}

const DOOR_W = 2.0
const DOOR_H = 2.9

function EndWall() {
  const segW = (W - DOOR_W) / 2
  return (
    <group position={[0, 0, END]}>
      <mesh position={[-(DOOR_W / 2 + segW / 2), H / 2, 0]}>
        <planeGeometry args={[segW, H]} />
        <meshStandardMaterial color="#1e2634" />
      </mesh>
      <mesh position={[DOOR_W / 2 + segW / 2, H / 2, 0]}>
        <planeGeometry args={[segW, H]} />
        <meshStandardMaterial color="#1e2634" />
      </mesh>
      {/* linteau */}
      <mesh position={[0, DOOR_H + (H - DOOR_H) / 2, 0]}>
        <planeGeometry args={[DOOR_W, H - DOOR_H]} />
        <meshStandardMaterial color="#1e2634" />
      </mesh>
      {/* encadrement lumineux — la porte de la démo attire l'œil */}
      <mesh position={[0, DOOR_H / 2, 0.01]}>
        <planeGeometry args={[DOOR_W + 0.16, DOOR_H + 0.1]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.9} />
      </mesh>
    </group>
  )
}

// La porte pivote quand on quitte le LOBBY (lerp doux, léger).
function SephoraDoor() {
  const hinge = useRef()
  const phase = useStore((s) => s.phase)
  const open = phase !== 'LOBBY'

  useFrame((_, dt) => {
    if (!hinge.current) return
    const target = open ? -Math.PI * 0.55 : 0
    hinge.current.rotation.y += (target - hinge.current.rotation.y) * Math.min(1, dt * 2.5)
  })

  return (
    <group position={[-DOOR_W / 2, 0, END]} ref={hinge}>
      <mesh position={[DOOR_W / 2, DOOR_H / 2, 0]}>
        <boxGeometry args={[DOOR_W, DOOR_H, 0.08]} />
        <meshStandardMaterial color="#101620" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* poignée */}
      <mesh position={[DOOR_W - 0.25, DOOR_H / 2, 0.08]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

function SideDoor({ door }) {
  const x = door.side === 'left' ? -W / 2 + 0.02 : W / 2 - 0.02
  const rotY = door.side === 'left' ? Math.PI / 2 : -Math.PI / 2
  return (
    <group position={[x, 0, door.pos[2]]} rotation={[0, rotY, 0]}>
      <mesh position={[0, DOOR_H / 2 - 0.25, 0]}>
        <planeGeometry args={[1.6, DOOR_H - 0.5]} />
        <meshStandardMaterial color="#131a26" />
      </mesh>
      {/* plaque au-dessus de la porte */}
      <mesh position={[0, DOOR_H - 0.45, 0.01]}>
        <planeGeometry args={[1.3, 0.28]} />
        <meshStandardMaterial color="#1a212d" emissive="#2a3a4a" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}
