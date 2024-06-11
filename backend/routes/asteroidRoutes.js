const express = require('express');
const {
  getAllAsteroids,
  getAsteroidDetails,
  getAsteroidVisibility,
} = require('../controllers/asteroidsController');


const router = express.Router();

router.get('/', getAllAsteroids);
router.get('/:id', getAsteroidDetails);
router.get('/:id/visibility', getAsteroidVisibility);



module.exports = router;
