import 'bootstrap/dist/css/bootstrap.min.css';
import SatellitesViewer from "./components/Drift/SatellitesViewer";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DriftVisualisation from './components/Drift/DriftVisualisation';
import { useState } from 'react';
import Home from './components/Home/Home';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import SocketStatus from './components/Common/SocketStatus';

function App() {
  const [selectedSatelliteName, setSelectedSatelliteName] = useState('');

  return (
    <WebSocketProvider>
      <BrowserRouter>
        <SocketStatus />
        <Routes>
          <Route path="/satellites" element={<SatellitesViewer setSelectedSatelliteName={setSelectedSatelliteName} satName={selectedSatelliteName}/>} />
          {/* <Route path="/satellites/drift" element={<DriftVisualisation satName={selectedSatelliteName} />} /> */}
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;
