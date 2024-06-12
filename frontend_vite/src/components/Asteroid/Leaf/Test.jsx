import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import worldGeoJson from './world-geojson.json'; // Ensure this file is in the src directory
import { API_ENDPOINTS } from '../../../constants/apiConstants';

// Custom icon for the asteroid
const asteroidIcon = new L.Icon({
  iconUrl: '/asteroid.png',
  iconSize: [32, 32], // size of the icon
});

const AsteroidVisibility = () => {
  const { asteroidId } = useParams();
  const [visibilityData, setVisibilityData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [geoJsonKey, setGeoJsonKey] = useState(0); // Key to force re-render of GeoJSON

  useEffect(() => {
    const fetchVisibilityData = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINTS.ASTEROIDS_DETAILS}/${asteroidId}/visibility`);
        const data = response.data.visibilityData;
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

  useEffect(() => {
    // Force re-render of GeoJSON layer to reset tooltips
    setGeoJsonKey((prevKey) => prevKey + 1);
  }, [selectedDate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const selectedVisibilityData = visibilityData.find(
    (data) => data.closeApproachDate === selectedDate
  );

  // Function to add tooltips to each country on hover
  const onEachCountry = (country, layer) => {
    if (country.properties && country.properties.name) {
      layer.on({
        mouseover: (e) => {
          const layer = e.target;
          const visibleCountry = selectedVisibilityData.visibleCountries.find(
            (c) => c.country === country.properties.iso_a2
          );
          const distance = visibleCountry ? (visibleCountry.distance / 1000).toFixed(2) : 'N/A';


          layer.bindTooltip(`${country.properties.name}${visibleCountry ? `<br>Distance: ${distance} km` : ''}`, {
            permanent: false,
            direction: 'center',
            className: 'country-tooltip',
          }).openTooltip();


        },
        mouseout: (e) => {
          const layer = e.target;
          layer.closeTooltip();
        }
      });
    }
  };

  return (
    <div>
      <h2>Asteroid Visibility</h2>
      <label htmlFor="date-select">Select Close Approach Date: </label>
      <select
        id="date-select"
        value={selectedDate}
        onChange={handleDateChange}
      >
        {visibilityData.map((data) => (
          <option key={data.closeApproachDate} value={data.closeApproachDate}>
            {data.closeApproachDate}
          </option>
        ))}
      </select>
      <MapContainer center={[0, 0]} zoom={2} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {selectedVisibilityData && (
          <>
            <Marker
              position={[
                selectedVisibilityData.position.latitude,
                selectedVisibilityData.position.longitude,
              ]}
              icon={asteroidIcon}
            />
            <Circle
              center={[
                selectedVisibilityData.position.latitude,
                selectedVisibilityData.position.longitude,
              ]}
              radius={selectedVisibilityData.searchRadius} // radius in meters
              color="blue"
            />
            <GeoJSON
              key={geoJsonKey}
              data={worldGeoJson}
              style={(feature) => ({
                fillColor: selectedVisibilityData.visibleCountries.some((c) => c.country === feature.properties.iso_a2)
                  ? 'green'
                  : 'gray',
                fillOpacity: 0.5,
                color: 'white',
                weight: 1,
              })}
              onEachFeature={onEachCountry}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default AsteroidVisibility;
