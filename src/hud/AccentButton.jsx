// Le bouton accent de la démo — UNE définition (règle de sobriété).
export default function AccentButton({ disabled, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#164e5a' : '#22d3ee',
        color: '#001014',
        border: 'none',
        padding: '10px 16px',
        borderRadius: 10,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// Eyebrow label des panneaux HUD — même définition partout (drift interdit).
export function PanelLabel({ children }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: 2, color: '#22d3ee', textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}
