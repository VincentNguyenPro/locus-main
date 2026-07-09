// Positions du monde — UNE source de vérité pour la scène ET la caméra.
// La tour est à l'origine ; la salle de réunion est un diorama à l'écart,
// la caméra vole de l'une à l'autre pendant la phase ROOM_OPEN.
export const BUILDING_POS = [0, 0, -10]
// La salle est DERRIÈRE la porte du fond du couloir (z=-14) : la caméra la traverse.
export const ROOM_POS = [0, 0, -20]

// Les portes du couloir — une par compte. Sephora au fond (la porte de la démo).
export const DOORS = [
  { id: 'sephora', name: 'SEPHORA', pos: [0, 3.05, -13.85], main: true },
  { id: 'loreal', name: "L'ORÉAL", pos: [-2.95, 2.75, -5], side: 'left' },
  { id: 'chanel', name: 'CHANEL', pos: [-2.95, 2.75, -9.5], side: 'left' },
  { id: 'qonto', name: 'QONTO', pos: [2.95, 2.75, -5], side: 'right' },
  { id: 'doctolib', name: 'DOCTOLIB', pos: [2.95, 2.75, -9.5], side: 'right' },
]
