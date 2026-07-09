import { useMemo, useEffect } from 'react'
import * as THREE from 'three'

// ── VERSION SCAFFOLD (tourne sans GLB) ──────────────────────────────
// Capsule qui passe de silhouette grise -> personne "réelle" (accent cyan).
// C'est le MOMENT SANCTUARISÉ de la démo. Une fois les modèles Quaternius
// dans /public/models, remplace le rendu par la version GLB ci-dessous.
export default function Person({ enriched = false, color = '#22d3ee', ...props }) {
  const material = useMemo(
    () =>
      enriched
        ? new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 })
        : new THREE.MeshStandardMaterial({
            color: '#8a8f98',
            transparent: true,
            opacity: 0.55,
          }),
    [enriched, color],
  )
  // Les matériaux THREE possèdent des ressources GPU : dispose obligatoire,
  // sinon chaque cycle run/reset fuit (context loss possible en répétition).
  useEffect(() => () => material.dispose(), [material])

  return (
    <group {...props}>
      <mesh position={[0, 1, 0]} material={material}>
        <capsuleGeometry args={[0.35, 1, 8, 16]} />
      </mesh>
      <mesh position={[0, 1.85, 0]} material={material}>
        <sphereGeometry args={[0.28, 24, 24]} />
      </mesh>
    </group>
  )
}

// ── VERSION GLB CIBLE (à activer quand les modèles sont dans /public) ─
// ⚠ Modèles Quaternius = riggés : utiliser SkeletonUtils.clone(), PAS scene.clone()
//   (clone() ne re-binde pas les squelettes → silhouettes déformées/fusionnées).
// import { useGLTF } from '@react-three/drei'
// import { SkeletonUtils } from 'three-stdlib'
// export default function Person({ enriched, ...props }) {
//   const { scene } = useGLTF('/models/businessman.glb')
//   const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
//   const grey = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8a8f98', transparent: true, opacity: 0.6 }), [])
//   useEffect(() => () => grey.dispose(), [grey])
//   useEffect(() => {
//     clone.traverse((o) => {
//       if (o.isMesh) {
//         if (!o.userData.originalMaterial) o.userData.originalMaterial = o.material
//         o.material = enriched ? o.userData.originalMaterial : grey
//       }
//     })
//   }, [enriched, clone, grey])
//   return <primitive object={clone} {...props} />
// }
// useGLTF.preload('/models/businessman.glb')
