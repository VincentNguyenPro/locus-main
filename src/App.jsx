import AccountGraph from './graph/AccountGraph.jsx'
import DistrictLobby from './hud/DistrictLobby.jsx'
import MeetingRoom from './hud/MeetingRoom.jsx'
import DirectoryBoard from './hud/DirectoryBoard.jsx'
import BriefingPanel from './hud/BriefingPanel.jsx'
import IntelPanel from './hud/IntelPanel.jsx'
import QAPanel from './hud/QAPanel.jsx'
import ContactCard from './hud/ContactCard.jsx'
import NodeDetail from './hud/NodeDetail.jsx'
import EmailPanel from './hud/EmailPanel.jsx'
import Dock from './hud/Dock.jsx'
import Caption from './hud/Caption.jsx'
import Landing from './hud/Landing.jsx'

// Deal Rooms — trois scènes plein écran pilotées par la machine à états :
//   LOBBY/ELEVATOR → le couloir photo (l'entrée)
//   ROOM_OPEN      → la deal room (qui est là, ce qu'ils ont dit, pourquoi)
//   ENRICHING+     → le graphe du compte (la vue de l'agent)
// Le HUD (panneaux verre) flotte au-dessus. Zéro WebGL : léger, fiable projecteur.
export default function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0c10' }}>
      <DistrictLobby />
      <MeetingRoom />
      <AccountGraph />

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <BriefingPanel />
        <DirectoryBoard />
        <IntelPanel />
        <QAPanel />
        <ContactCard />
        <NodeDetail />
        <EmailPanel />
        <Dock />
        <Caption />
      </div>

      {/* L'ouverture éditoriale (phase INTRO) — au-dessus de tout */}
      <Landing />
    </div>
  )
}
