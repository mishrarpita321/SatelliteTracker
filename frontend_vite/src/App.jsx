import 'bootstrap/dist/css/bootstrap.min.css';
import SatellitesViewer from "./components/Drift/SatellitesViewer";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DriftVisualisation from './components/Drift/DriftVisualisation';
import React, { useState } from 'react';
import Navbar from './components/Common/Navigation';
import Home from './components/Home/Home';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import SocketStatus from './components/Common/SocketStatus';
import Login from './components/Common/Login';
import AstronautTracking from './components/Astronaut/Astronaut';

import './App.css';

function App() {
  const [selectedSatelliteName, setSelectedSatelliteName] = useState('');

  const [authenticated, setAuthenticated] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthenticated(false);
  };

  return (
    <WebSocketProvider>
      <BrowserRouter>
        <SocketStatus />
        <div className="App background-container">
        <Navbar authenticated={authenticated} handleLogout={handleLogout}/>
          <Routes>
            <Route path="/satellites" element={<SatellitesViewer setSelectedSatelliteName={setSelectedSatelliteName} />} />
            <Route path="/drift" element={<DriftVisualisation satName={selectedSatelliteName} />} />
            <Route path="/" element={authenticated ? <Home /> : <Navigate to="/login" />} />
            <Route path="/astronaut" element={authenticated ? <AstronautTracking /> : <Navigate to="/login" />} />
            <Route path="/login" element={<Login setAuthenticated={setAuthenticated} />} />
          </Routes>
        </div> 
      </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;
