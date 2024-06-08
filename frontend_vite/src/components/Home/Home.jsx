import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleAstronaut = () => {
    navigate('/astronaut');
  };

  const handleSatelliteDrift = () => {
    navigate('/drift');
  };

  const handleSatelliteCollision = () => {
    navigate('/');
  };

  const handleNearEarthObjects = () => {
    navigate('/');
  };

  const handleImageOverlay = () => {
    navigate('/');
  };

  return (
    <div>
      <div className="custom-wrap">
        <h2 className="custom-title"> Data Miners</h2>
        <form className="custom-section">
          <div>
            <button type="button" onClick={handleAstronaut} className="custom-button">
              <span>AstroComms</span>
            </button>
            <button type="button" onClick={handleSatelliteDrift} className="custom-button">
              <span>Satellite Drift</span>
            </button>
            <button type="button" onClick={handleSatelliteCollision} className="custom-button">
              <span>Satellite Collision</span>
            </button>
            <button type="button" onClick={handleNearEarthObjects} className="custom-button">
              <span>Near-Earth Objects</span>
            </button>
            <button type="button" onClick={handleImageOverlay} className="custom-button">
              <span>Image Overlay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;
