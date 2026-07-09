import { useStore, isEnriched } from './store.js'
import Person from './Person.jsx'

// La salle hero : un diorama « étage de réunion » posé à l'écart de la tour —
// la caméra y vole pendant l'ascenseur (l'étage du compte Sephora).
// 2 stakeholders connus + 1 silhouette grise qui s'enrichit à la démo.
export default function Room(props) {
  const enrichedMain = useStore(isEnriched)

  return (
    <group {...props}>
      <pointLight position={[0, 4, 0]} intensity={0.5} color="#22d3ee" />
      <pointLight position={[0, 3, 4]} intensity={0.3} color="#ffffff" />

      {/* sol de l'étage */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#12151b" />
      </mesh>

      {/* murs (fond + côtés) : la salle se lit comme une pièce */}
      <mesh position={[0, 2, -4]}>
        <planeGeometry args={[16, 4]} />
        <meshStandardMaterial color="#171c26" />
      </mesh>
      <mesh position={[-8, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#151a23" />
      </mesh>
      <mesh position={[8, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#151a23" />
      </mesh>

      {/* écran mural cyan (salle de réunion) */}
      <mesh position={[0, 2.2, -3.98]}>
        <planeGeometry args={[4.5, 1.8]} />
        <meshStandardMaterial color="#0d1420" emissive="#22d3ee" emissiveIntensity={0.25} />
      </mesh>

      {/* table de réunion (placeholder — remplaçable par GLB Kenney) */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[3, 0.1, 1.4]} />
        <meshStandardMaterial color="#1c212b" />
      </mesh>
      {[-1.2, 1.2].map((x) =>
        [-0.5, 0.5].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.37, z]}>
            <boxGeometry args={[0.08, 0.75, 0.08]} />
            <meshStandardMaterial color="#232a36" />
          </mesh>
        )),
      )}

      {/* 3 stakeholders */}
      <Person enriched position={[-1.6, 0, -0.6]} color="#94a3b8" />
      <Person enriched position={[1.6, 0, -0.6]} color="#94a3b8" />
      {/* la silhouette grise — le moment sanctuarisé */}
      <Person enriched={enrichedMain} position={[0, 0, -1.6]} />
    </group>
  )
}
