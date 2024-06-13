import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [weatherOverlayImage, setWeatherOverlayImage] = useState(null);
  const [cloudOverlayImage, setCloudOverlayImage] = useState(null);
  const [satelliteImage, setSatelliteImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Reset image states to null
    setWeatherOverlayImage(null);
    setCloudOverlayImage(null);
    setSatelliteImage(null);

    const data = {
      location: location,
      timeInterval: [startTime, endTime],
    };

    try {
      const response = await axios.post('http://localhost:5000/api/eopatch', data);
      setWeatherOverlayImage(`http://localhost:5000/${response.data.weather_overlay}`);
      setCloudOverlayImage(`http://localhost:5000/${response.data.cloud_overlay}`);
      setSatelliteImage(`http://localhost:5000/${response.data.satellite_image}`);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Jor_App">
      <nav className='Jor_nav'>
        SatCapPic - Satellite Image Weather Overlay & Prediction
      </nav>
      <div className="Jor_form-container">
        <div className="Jor_header">
          Specifications
        </div>
        <form onSubmit={handleSubmit} className='Jor_form'>
          <div className="Jor_form-group">
            <label>Location: </label>
            <input
              type="text"
              placeholder="Enter a Country"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="Jor_form-group">
            <label>Start Day: </label>
            <input
              type="date"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="Jor_form-group">
            <label>End Day: </label>
            <input
              type="date"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className='Jor_Btn'>
            {loading ? 'Loading...' : 'Generate'}
          </button>
        </form>
      </div>
      {loading && (
          <div className="Jor_loading-container">
            Loading...
          </div>
        )}
      {!loading && weatherOverlayImage && cloudOverlayImage && satelliteImage && (
        <div className="Jor_image-container">
          <div className="Jor_header">
            Output
          </div>
          <div className="Jor_image-wrapper">
            <div className="Jor_image-card">
              <h3>Satellite Image</h3>
              <img src={satelliteImage} alt="Satellite Image" />
            </div>
            <div className="Jor_image-card">
              <h3>Weather Overlay</h3>
              <img src={weatherOverlayImage} alt="Weather Overlay" />
            </div>
            <div className="Jor_image-card">
              <h3>Cloud Overlay</h3>
              <img src={cloudOverlayImage} alt="Cloud Overlay" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
