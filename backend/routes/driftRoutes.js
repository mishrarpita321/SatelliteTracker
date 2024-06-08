const express = require('express');
const {
  fetchAndStoreSatelliteData
} = require('../controllers/driftController');
const { fetchSatelliteTle, predictAllSatellitePosition, fetchSatelliteDataById, fetchSatellitePositionById, 
  predictSatellitePositionByName, fetchAndStoreGroupSatelliteData, predictSatelliteGroupPositions } = require('../controllers/driftSatellitePositions');
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

router.get('/fetch/:group', fetchAndStoreGroupSatelliteData);

router.post('/predict-groupsatellite-positions', predictSatelliteGroupPositions);

module.exports = router;
