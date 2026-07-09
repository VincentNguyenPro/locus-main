import { useRef, useEffect } from 'react'
import { CameraControls } from '@react-three/drei'
import { useStore } from './store.js'
import { ROOM_POS } from './layout.js'

const [RX, , RZ] = ROOM_POS

// Caméra pilotée par la phase (les méthodes CameraControls renvoient des Promises).
// L'ascenseur = MULTIPLICATEUR : décision 13h — si ça bugue, tout retombe sur
// des plans fixes (chaque case est indépendante, couper = supprimer une case).
export default function CameraRig() {
  const controls = useRef()
  const phase = useStore((s) => s.phase)

  useEffect(() => {
    const c = controls.current
    if (!c) return
    let cancelled = false
    async function move() {
      switch (phase) {
        case 'LOBBY':
        case 'ELEVATOR':
          // La photo du couloir couvre l'écran : on pré-cadre la salle
          // (sans transition) pour que le fondu révèle un plan déjà prêt.
          c.setLookAt(RX, 2.4, RZ + 7, RX, 1.1, RZ - 0.8, false)
          break
        case 'ROOM_OPEN':
          // Le fondu révèle la salle, la caméra finit d'y entrer (push-in doux).
          c.smoothTime = 1.4
          await c.setLookAt(RX, 2.0, RZ + 5.0, RX, 1.1, RZ - 0.8, true)
          break
        case 'ENRICHING':
        case 'ENRICHED':
        case 'EMAIL_SENT':
          // Zoom sur la silhouette — le moment sanctuarisé.
          c.smoothTime = 0.8
          await c.setLookAt(RX, 1.8, RZ + 3.4, RX, 1.2, RZ - 1.6, true)
          break
        default:
          break
      }
    }
    move()
    return () => {
      cancelled = true
    }
  }, [phase])

  // Caméra VERROUILLÉE : uniquement les mouvements scriptés par phase.
  // (Impossible de se perdre en pleine démo — 0 = ACTION.NONE.)
  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.6}
      mouseButtons-left={0}
      mouseButtons-middle={0}
      mouseButtons-right={0}
      mouseButtons-wheel={0}
      touches-one={0}
      touches-two={0}
      touches-three={0}
    />
  )
}
