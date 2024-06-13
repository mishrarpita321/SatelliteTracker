import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ClipLoader } from 'react-spinners';

import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { API_ENDPOINTS } from '../../constants/apiConstants';

const Astronaut = () => {
  const [astronauts, setAstronauts] = useState([]);
  const [selectedAstronaut, setSelectedAstronaut] = useState('');
  const [selectedAstronautId, setSelectedAstronautId] = useState('');
  const [observerName, setObserverName] = useState('');
  const [observerLatitude, setObserverLatitude] = useState('');
  const [observerLongitude, setObserverLongitude] = useState('');
  const [observerAltitude, setObserverAltitude] = useState('');
  const [satellites, setSatellites] = useState([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInitializedRef = useRef(false);

  useEffect(() => {
    fetchAstronauts();
  }, []);

  const fetchAstronauts = async () => {
    console.log('Fetching astronauts...');
    try {
      const response = await axios.get(`${API_ENDPOINTS.ASTRONAUT}`);
      setAstronauts(response.data);
    } catch (error) {
      console.error('Error fetching astronauts:', error);
    }
  };

  const handleAstronautChange = (e) => {
    const selectedAstronaut = e.target.value;
    const selectedAstronautData = astronauts.find(astronaut => astronaut.astronautName === selectedAstronaut);
    if (selectedAstronautData) {
      setSelectedAstronaut(selectedAstronaut);
      setSelectedAstronautId(selectedAstronautData._id);
      setObserverName(selectedAstronautData.astronautName);
      setObserverLongitude(selectedAstronautData.longitude);
      setObserverLatitude(selectedAstronautData.latitude);
      setObserverAltitude(selectedAstronautData.altitude);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading
    try {
      const response = await axios.post(`${API_ENDPOINTS.ASTRONAUT_SATELLITE}`, {
        astronautId: selectedAstronautId,
        astronautName: observerName,
        latitude: observerLatitude,
        longitude: observerLongitude,
        altitude: observerAltitude
      });
      if (Array.isArray(response.data)) {
        setSatellites(response.data);
      } else {
        console.error('Response data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Error fetching satellite data:', error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    if (satellites.length > 0) {
      if (!mapInitializedRef.current) {
        initializeMap(satellites);
        mapInitializedRef.current = true;
      } else {
        updateMap(satellites);
      }
      setLoading(false);
    }
  }, [satellites]);

  const initializeMap = (satellites) => {
    mapRef.current = L.map('map').setView([observerLatitude, observerLongitude], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CartoDB'
    }).addTo(mapRef.current); 
    updateMap(satellites);
  };

  const updateMap = (satellites) => {
    let observerMarker;
  
    if (mapRef.current) {
      // Clearing existing markers and polylines
      mapRef.current.eachLayer((layer) => {
        if ((layer instanceof L.Marker || layer instanceof L.Polyline) && layer !== observerMarker) {
          mapRef.current.removeLayer(layer);
        }
      });
  
      // custom icon for the observer marker
      const observerIcon = L.icon({
        iconUrl: 'astronaut.png', 
        iconSize: [50, 50], 
        iconAnchor: [12, 41],
        shadowUrl: markerShadow,
        shadowSize: [60, 60],
        shadowAnchor: [12, 41],
      });
  
      observerMarker = L.marker([observerLatitude, observerLongitude], { icon: observerIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          Astronaut:  ${observerName}<br>
          Latitude: ${observerLatitude}<br>
          Longitude: ${observerLongitude}<br>
          Altitude: ${observerAltitude} km<br>
        `);
  
      // custom icon for the satellites markers
      const customIcon = L.icon({
        iconUrl: 'blue_satellite.png',
        shadowUrl: markerShadow,
        iconSize: [40, 40],
        shadowSize: [50, 50], 
        popupAnchor: [0, -41] 
      });
  
      // Add new markers for satellites
      satellites.forEach(satellite => {
        if (satellite.satlat && satellite.satlng) {
          L.marker([satellite.satlat, satellite.satlng], { icon: customIcon })
            .addTo(mapRef.current)
            .bindPopup(`
              Satellite: ${satellite.satname}<br>
              Latitude: ${satellite.satlat}<br>
              Longitude: ${satellite.satlng}<br>
              Altitude: ${satellite.satalt} km<br>
              Distance: ${satellite.distance} km
            `);
        }
      });
  
      // marker for the closest satellite to the observer
      const closestSatellite = satellites[0];
      const closestSatelliteIcon = L.icon({
        iconUrl: 'green_satellite.png',
        iconSize: [40, 40], 
        shadowUrl: markerShadow,
        shadowSize: [50, 50], 
        popupAnchor: [0, -41]
      });
      L.marker([closestSatellite.satlat, closestSatellite.satlng], { icon: closestSatelliteIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          Closest Satellite: ${closestSatellite.satname} <br>
          Latitude: ${closestSatellite.satlat}<br>
          Longitude: ${closestSatellite.satlng}<br>
          Altitude: ${closestSatellite.satalt} km<br>
          Distance: ${closestSatellite.distance} km
        `);

      L.polyline([
        [observerLatitude, observerLongitude],
        [closestSatellite.satlat, closestSatellite.satlng]
      ], { color: 'green', weight: 10 }).addTo(mapRef.current);
    }
  };
  

  return (
    <div className="background-container-astronaut">
      <form onSubmit={handleSubmit}>
        <h3 className="h3-astronaut">
          Select Astronaut:{' '}
          <select className="custom-select" value={selectedAstronaut} onChange={handleAstronautChange}>
            <option value="">
              Select Astronaut
            </option>
            {astronauts.map(astronaut => (
              <option key={astronaut._id} value={astronaut.astronautName}>
                {astronaut.astronautName}
              </option>
            ))}
          </select>
        </h3>
        {observerLongitude && observerLatitude && observerAltitude && (
          <h3 className="h3-astronaut">
            {' '}
            Astronaut Coordinates: 
            {`
              Longitude: ${observerLongitude}, 
              Latitude: ${observerLatitude}, 
              Altitude: ${observerAltitude} km
            `}
          </h3>
        )}
        <button className="custom-button-1" type="submit">Fetch Satellite Data</button>
        <br />
      </form>
      <div style={{ position: 'relative', width: '100%', height: '500px' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 9999
          }}>
            <ClipLoader size={150} color={"#123abc"} loading={loading} />
          </div>
        )}
        <div id="map" style={{ width: '100%', height: '100%' }}></div>
      </div>
    </div>
  );
};

export default Astronaut;