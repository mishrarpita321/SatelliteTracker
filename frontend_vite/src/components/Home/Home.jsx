import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleAstronaut = () => {
    navigate('/astronaut');
    // navigate('/astronaut', { replace: true });
  };
  const handleSatelliteDrift = () => {
    window.location.href = '/satellites';

    // navigate('/satellites');
    // navigate('/satellites',{replace: true});
  };
  const handleAsteroids = () => {
    navigate('/asteroids');
  };
  const handleSatelliteCollision = () => {
    navigate('/');
  };
  const handleImageOverlay = () => {
    navigate('/');
  };

  return (
    <div className="background-container-astronaut">
      <div className="custom-wrap">
        <h2 className="custom-title"> Data Miners</h2>
        <form className="custom-section">
          <div>
            <button type="button" onClick={handleAstronaut} className="custom-button">
              <span>Astronaut Nearest Satellites</span>
            </button>
            <button type="button" onClick={handleSatelliteDrift} className="custom-button">
              <span>Satellite Drift</span>
            </button>
            <button type="button" onClick={handleAsteroids} className="custom-button">
              <span>Asteroids List</span>
            </button>
            {/* <button type="button" onClick={handleSatelliteCollision} className="custom-button">
              <span>Satellite Collision</span>
            </button>
            <button type="button" onClick={handleImageOverlay} className="custom-button">
              <span>Image Overlay</span>
            </button> */}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;
