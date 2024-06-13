import 'bootstrap/dist/css/bootstrap.min.css';
import SatellitesViewer from "./components/Drift/SatellitesViewer";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DriftVisualisation from './components/Drift/DriftVisualisation';
import React, { useState } from 'react';
import Navbar from './components/Common/Navigation';
import Home from './components/Home/Home';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import SocketStatus from './components/Common/SocketStatus';

import AsteroidListScreen from './components/Asteroid/AsteroidListScreen';
import AsteroidOrbit from './components/Asteroid/AsteroidOrbit';
import Login from './components/Common/Login';
import AstronautTracking from './components/Astronaut/Astronaut';

import './App.css';
import AsteroidVisibility from './components/Asteroid/Leaf/AsteroidVisibility';


function App() {
  const [selectedSatelliteName, setSelectedSatelliteName] = useState('');
  
  return (
    <WebSocketProvider>
      <BrowserRouter>
        <SocketStatus />

        <div className="App background-container">
        <Navbar/>
          <Routes>
            <Route path="/asteroids" element={<AsteroidListScreen />} />
            <Route path="/asteroid/:asteroidId" element={<AsteroidOrbit/>} />
            <Route path="/asteroid/details/:asteroidId" element={<AsteroidVisibility />} />
            <Route path="/satellites" element={<SatellitesViewer setSelectedSatelliteName={setSelectedSatelliteName} satName={selectedSatelliteName}/>} />
            <Route path="/drift" element={<DriftVisualisation satName={selectedSatelliteName}/>}/>
            <Route path="/" element={<Home /> }/>
            <Route path="/astronaut" element={<AstronautTracking />} />
          </Routes>
        </div> 

      </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;
