import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DOORS } from './layout.js'
import { useStore } from './store.js'

// Étiquettes de portes : DOM net projeté depuis la 3D.
// Registre module-level partagé entre le HUD (DOM) et le Canvas (projection).
// ⚠ JAMAIS via le state React (re-render 60fps) — écriture directe des transforms.
const registry = new Map()

export function registerLabel(id, el) {
  if (el) registry.set(id, el)
  else registry.delete(id)
}

// ── Côté Canvas : projette chaque porte vers son étiquette DOM ───────────────
const v = new THREE.Vector3()
export function LabelProjector() {
  const phase = useStore((s) => s.phase)
  const show = phase === 'LOBBY' || phase === 'ELEVATOR'

  useFrame(({ camera, size }) => {
    for (const door of DOORS) {
      const el = registry.get(door.id)
      if (!el) continue
      if (!show) {
        el.style.opacity = '0'
        continue
      }
      v.set(...door.pos).project(camera)
      const behind = v.z > 1
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      el.style.opacity = behind ? '0' : '1'
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`
    }
  })
  return null
}

// ── Côté HUD : les éléments DOM (nets, lisibles à 8m) ────────────────────────
export function DoorLabelsOverlay() {
  return (
    <>
      {DOORS.map((d) => (
        <div
          key={d.id}
          ref={(el) => registerLabel(d.id, el)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
            padding: d.main ? '6px 14px' : '3px 10px',
            borderRadius: 8,
            fontSize: d.main ? 15 : 11,
            fontWeight: d.main ? 700 : 500,
            letterSpacing: 1.5,
            color: d.main ? '#001014' : '#9ca3af',
            background: d.main ? '#22d3ee' : 'rgba(255,255,255,0.07)',
            border: d.main ? 'none' : '1px solid rgba(255,255,255,0.12)',
            whiteSpace: 'nowrap',
          }}
        >
          {d.name}
          {d.main && <span style={{ fontWeight: 400, marginLeft: 8, fontSize: 11 }}>3 signals · 1 unknown</span>}
        </div>
      ))}
    </>
  )
}
