import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import worldGeoJson from './world-geojson.json'; // Ensure this file is in the src directory
import { API_ENDPOINTS } from '../../../constants/apiConstants';

// Custom icon for the asteroid
const asteroidIcon = new L.Icon({
  iconUrl: '/asteroid.png',
  iconSize: [32, 32], // size of the icon
});

// Converts degrees to radians
function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

// Haversine formula to calculate distance between two points in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate the centroid of a polygon or multipolygon
function getCentroid(geometry) {
  let centroid = [0, 0];
  let signedArea = 0.0;

  const calculatePolygonCentroid = (coordinates) => {
    let tempCentroid = [0, 0];
    let tempSignedArea = 0.0;
    let x0 = 0.0; // Current vertex X
    let y0 = 0.0; // Current vertex Y
    let x1 = 0.0; // Next vertex X
    let y1 = 0.0; // Next vertex Y
    let a = 0.0;  // Partial signed area

    for (let i = 0; i < coordinates[0].length - 1; i++) {
      x0 = coordinates[0][i][0];
      y0 = coordinates[0][i][1];
      x1 = coordinates[0][i + 1][0];
      y1 = coordinates[0][i + 1][1];
      a = x0 * y1 - x1 * y0;
      tempSignedArea += a;
      tempCentroid[0] += (x0 + x1) * a;
      tempCentroid[1] += (y0 + y1) * a;
    }

    tempSignedArea *= 0.5;
    tempCentroid[0] /= (6.0 * tempSignedArea);
    tempCentroid[1] /= (6.0 * tempSignedArea);

    return { centroid: tempCentroid, signedArea: tempSignedArea };
  };

  if (geometry.type === "Polygon") {
    const result = calculatePolygonCentroid(geometry.coordinates);
    centroid = result.centroid;
    signedArea = result.signedArea;
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon) => {
      const result = calculatePolygonCentroid(polygon);
      centroid[0] += result.centroid[0] * result.signedArea;
      centroid[1] += result.centroid[1] * result.signedArea;
      signedArea += result.signedArea;
    });

    centroid[0] /= signedArea;
    centroid[1] /= signedArea;
  }

  return centroid;
}

const AsteroidVisibility = () => {
  const { asteroidId } = useParams();
  const [visibilityData, setVisibilityData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [clickedCountry, setClickedCountry] = useState(null);
  const [clickedCountryDistance, setClickedCountryDistance] = useState(null);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setClickedCountry(null);
    setClickedCountryDistance(null);
  };

  const selectedVisibilityData = visibilityData.find(
    (data) => data.closeApproachDate === selectedDate
  );

  const onEachCountry = (country, layer) => {
    if (country.properties && country.properties.name) {
      layer.on({
        mouseover: (e) => {
          const layer = e.target;
          layer.bindTooltip(country.properties.name, {
            permanent: false,
            direction: 'center',
            className: 'country-tooltip',
          }).openTooltip();
        },
        mouseout: (e) => {
          const layer = e.target;
          layer.closeTooltip();
        },
        click: () => {
          if (selectedVisibilityData) {
            const centroid = getCentroid(country.geometry);
            if (centroid) {
              const distance = calculateDistance(
                selectedVisibilityData.position.latitude,
                selectedVisibilityData.position.longitude,
                centroid[1], // Latitude
                centroid[0]  // Longitude
              );
              setClickedCountry(country.properties.name);
              setClickedCountryDistance(distance);
            }
          }
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
              radius={selectedVisibilityData.searchRadiusKm * 1000} // radius in meters
              color="blue"
            />
            <GeoJSON
              data={worldGeoJson}
              style={(feature) => ({
                fillColor: selectedVisibilityData.visibleCountries.includes(feature.properties.iso_a2)
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
        {clickedCountry && clickedCountryDistance !== null && (
          <Popup
            position={[
              selectedVisibilityData.position.latitude,
              selectedVisibilityData.position.longitude,
            ]}
          >
            <div>
              <h4>{clickedCountry}</h4>
              <p>Distance: {clickedCountryDistance.toFixed(2)} km</p>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
};

export default AsteroidVisibility;
