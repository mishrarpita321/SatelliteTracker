const express = require('express');
const AstronautSatellite = require('../models/AstronautSatellite');
const Astronaut = require('../models/Astronaut'); 
const User = require('../models/User');
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// GET: Fetch all astronauts
router.get('/astronauts', async (req, res) => {
  try {
    const astronauts = await Astronaut.find();
    res.status(200).json(astronauts);
  } catch (error) {
    console.error('Error fetching astronauts:', error);
    res.status(500).json({ error: 'Failed to fetch astronauts' });
  }
});

// POST: Satellite
router.post('/satellite', async (req, res) => {
  try {
    const { latitude, longitude, altitude } = req.body;
    const API_KEY = process.env.N2YO_API_KEY;
    const observerLatitude = latitude;
    const observerLongitude = longitude;
    const observerAltitude = altitude || 0;
    const searchRadius = req.body.radius || 90; // Search radius (optional, default: 90 degrees)

    const apiUrl = `https://api.n2yo.com/rest/v1/satellite/above/${observerLatitude}/${observerLongitude}/${observerAltitude}/${searchRadius}/0/&apiKey=${API_KEY}`;

    const response = await axios.get(apiUrl);
    const { data } = response;

    if (data && data.above) {
      const satellitesData = data.above.map(satellite => ({
        category: satellite.category,
        satid: satellite.satid,
        satname: satellite.satname,
        satlat: satellite.satlat,
        satlng: satellite.satlng,
        satalt: satellite.satalt,
        distance: distance(observerLatitude, observerLongitude, observerAltitude, satellite.satlat, satellite.satlng, satellite.satalt),
      }));

      // distance between observer and satellites
      satellitesData.forEach(satellite => {
        satellite.distance = distance(observerLatitude, observerLongitude, observerAltitude, satellite.satlat, satellite.satlng, satellite.satalt);
      });

      // Sort satellites by distance
      satellitesData.sort((a, b) => a.distance - b.distance);

      await AstronautSatellite.deleteMany();

      await AstronautSatellite.insertMany(satellitesData);

      const closestSatellites = satellitesData.slice(0, 10);
      
      res.status(200).json(closestSatellites);
    } else {
      console.error('Invalid response from N2YO API');
      res.status(500).json({ error: 'Invalid response from N2YO API' });
    }
  } catch (error) {
    console.error('Error fetching data from N2YO:', error);
    res.status(500).json({ error: 'Failed to fetch data from N2YO' });
  }
});

// Function to calculate distance between two points using Haversine formula
function distance(lat1, lon1, alt1, lat2, lon2, alt2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const dAlt = alt2 - alt1;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // distance in km
  const distance2D = R * c;

  // 3D distance (including altitude difference)
  const distance3D = Math.sqrt(distance2D ** 2 + dAlt ** 2);

  return distance3D;
}

// Login user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await User.findOne({ username });
      if (!user) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

      res.json({ token });
  } catch (error) {
      res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;