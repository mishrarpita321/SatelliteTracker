const express = require('express');
const {
  fetchAndStoreSatelliteData
} = require('../controllers/driftController');
const { fetchAndStoreGroupSatelliteData, 
  getPost,
  driftDetectionFn} = require('../controllers/driftSatellitePositions');
const router = express.Router();


router.get('/fetchAndSave', fetchAndStoreSatelliteData);

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

router.get('/satelliteDriftPos', getPost);

router.post('/check-drift', async (req, res) => {
  console.log('req.body:', req.body);
  try {
      const message = await driftDetectionFn(req.body);
      res.status(200).send({ message });
  } catch (error) {
      res.status(500).send({ error: 'Internal Server Error' });
  }
});

module.exports = router;
