const express = require('express');
const {
  getAllAsteroids,
  getAsteroidDetails,  
} = require('../controllers/asteroidsController');


const router = express.Router();

router.get('/', getAllAsteroids);
// router.get('/:id', getAsteroidDetails);



module.exports = router;
