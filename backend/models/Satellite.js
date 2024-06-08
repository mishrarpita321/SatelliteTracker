const mongoose = require('mongoose');

const satelliteSchema = new mongoose.Schema({
  noradCatId: String,
  satellite: String,
  line1: String,
  line2: String,
  timeStamp: [{ type: Date }],
});

const Satellite = mongoose.model('Satellite', satelliteSchema);

module.exports = Satellite;
