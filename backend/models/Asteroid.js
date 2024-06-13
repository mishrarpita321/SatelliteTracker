const mongoose = require('mongoose');

const asteroidSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    neo_reference_id: { type: String, required: true },
    name: { type: String, required: true },
    name_limited: { type: String, required: false },
    designation: { type: String, required: false },
    nasa_jpl_url: { type: String, required: true },
    absolute_magnitude_h: { type: Number, required: true },
    estimated_diameter: {
        kilometers: {
            estimated_diameter_min: { type: Number, required: true },
            estimated_diameter_max: { type: Number, required: true }
        },
        meters: {
            estimated_diameter_min: { type: Number, required: true },
            estimated_diameter_max: { type: Number, required: true }
        },
        miles: {
            estimated_diameter_min: { type: Number, required: true },
            estimated_diameter_max: { type: Number, required: true }
        },
        feet: {
            estimated_diameter_min: { type: Number, required: true },
            estimated_diameter_max: { type: Number, required: true }
        }
    },
    is_potentially_hazardous_asteroid: { type: Boolean, required: true },
    is_sentry_object: { type: Boolean, required: true },
    last_updated: { type: Date, required: true }
});

const Asteroid = mongoose.model('Asteroid', asteroidSchema);

module.exports = Asteroid;
