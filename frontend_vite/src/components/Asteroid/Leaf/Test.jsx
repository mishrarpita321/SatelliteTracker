import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import worldGeoJson from '../custom.geo.json'; // Make sure this file is in the src directory
import { API_ENDPOINTS } from '../../../constants/apiConstants';

const Test = ({ asteroidId }) => {
  const [visibilityData, setVisibilityData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisibilityData = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINTS.ASTEROIDS_DETAILS}/${asteroidId}/visibility`);
        const data = response.data.visibilityData; // Directly accessing response.data
        setVisibilityData(data);
        if (data.length > 0) {
          setSelectedDate(data[0].closeApproachDate);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching visibility data:', error);
        setLoading(false);
      }
    };

    fetchVisibilityData();
  }, [asteroidId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const selectedData = visibilityData.find(data => data.closeApproachDate === selectedDate);

  const style = (feature) => {
    return {
      fillColor: selectedData && selectedData.visibleCountries.includes(feature.properties.iso_a2) ? 'green' : 'gray',
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7,
    };
  };

  return (
    <div>
      <select value={selectedDate} onChange={handleDateChange}>
        {visibilityData.map(data => (
          <option key={data.closeApproachDate} value={data.closeApproachDate}>
            {data.closeApproachDate}
          </option>
        ))}
      </select>
      <MapContainer center={[20, 0]} zoom={2} style={{ height: '100vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        {selectedData && (
          <>
            <GeoJSON data={worldGeoJson} style={style} />
            <Marker position={[selectedData.position.latitude, selectedData.position.longitude]}>
              <Popup>
                Asteroid Position on {selectedData.closeApproachDate}
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default Test;
