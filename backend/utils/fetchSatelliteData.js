// src/utils/fetchTleData.js
const axios = require('axios');

const fetchSatelliteData = async () => {
    const url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json'
    const response = await axios.get(url);
    return response.data;
};

module.exports = fetchSatelliteData;
