const mongoose = require('mongoose');

const AstronautSatelliteSchema = new mongoose.Schema({
  astronautId: { type: mongoose.Schema.Types.ObjectId, ref: 'Astronaut' },
  category: String,
  satid: Number,
  satname: String,
  satlat: Number,
  satlng: Number,
  satalt: Number,
  distance: Number,
  timestamp: { type: Date, default: Date.now },
});

const AstronautSatellite = mongoose.model('AstronautSatellite', AstronautSatelliteSchema);

module.exports = AstronautSatellite;