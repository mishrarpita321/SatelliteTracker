const express = require('express');
const {
  fetchAndStoreSatelliteData,
  saveToNeo4j
} = require('../controllers/driftController');
const { fetchSatelliteTle, predictAllSatellitePosition, fetchSatelliteDataById, fetchSatellitePositionById, 
  predictSatellitePositionByName, fetchAndStoreGroupSatelliteData, predictSatelliteGroupPositions, 
  getSatelliteOrbitalParameters,
  getPost} = require('../controllers/driftSatellitePositions');
const axios = require('axios');
const router = express.Router();


// router.get('/', getAllAsteroids);
// router.get('/:id', getAsteroidDetails);
router.get('/fetchAndSave', fetchAndStoreSatelliteData);

// router.get('/satellite/:id', async (req, res) => {
//   const { id } = req.params;
//   try {
//     const response = await axios.get(`https://api.n2yo.com/rest/v1/satellite/positions/${id}/0/0/0/1&apiKey=BM9D7P-ZZ5VBV-YCHSQC-59F2`);
//     res.json(response.data);
//   } catch (error) {
//     res.status(500).send('Error fetching satellite data');
//   }
// });

router.get('/satellitePositions', fetchSatelliteTle);

// router.get('/predict-satellite-positions', predictAllSatellitePosition);

router.get('/satellite/:id', async (req, res) => {
  const noradCatId = req.params.id;

  try {
    const satelliteData = await fetchSatellitePositionById(noradCatId);
    res.json(satelliteData);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});


router.get('/satelliteData/:id', async (req, res) => {
  const noradCatId = req.params.id;

  try {
    const satelliteData = await fetchSatelliteDataById(noradCatId);
    res.json(satelliteData);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});


router.post('/getSatellitePosition', predictSatellitePositionByName);

// router.get('/fetch/:group', fetchAndStoreGroupSatelliteData);
const groups = ['intelsat', 'iridium', 'starlink', 'other-comm'];

router.get('/fetch/all', async (req, res) => {
    try {
        const fetchPromises = groups.map(group => fetchAndStoreGroupSatelliteData(group));
        await Promise.all(fetchPromises);
        res.json("All satellite group data saved successfully.");
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/predict-groupsatellite-positions', predictSatelliteGroupPositions);

router.get('/satelliteDriftPos', getPost);

router.post('/check-drift', async (req, res) => {
  console.log('req.body:', req.body);
  try {
      const message = await saveToNeo4j(req.body);
      res.status(200).send({ message });
  } catch (error) {
      res.status(500).send({ error: 'Internal Server Error' });
  }
});

module.exports = router;
