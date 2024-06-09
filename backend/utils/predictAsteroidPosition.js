const { neo4jDriver } = require('../config/db');

function getAsteroidOrbitalPosition(orbitalData, date) {
    const mu = 132712440018; // Standard gravitational parameter for the sun in km^3/s^2
    const a = parseFloat(orbitalData.semi_major_axis) * 149597870.7; // Semi-major axis in km
    const e = parseFloat(orbitalData.eccentricity);
    const I = parseFloat(orbitalData.inclination) * Math.PI / 180; // Inclination in radians
    const omega = parseFloat(orbitalData.perihelion_argument) * Math.PI / 180; // Argument of periapsis in radians
    const Omega = parseFloat(orbitalData.ascending_node_longitude) * Math.PI / 180; // Longitude of ascending node in radians

    // Convert date string to Date object if necessary
    const currentDate = (typeof date === 'string') ? new Date(date) : date;

    // Calculate the mean anomaly at the given date
    const epoch = new Date(orbitalData.orbit_determination_date); // Epoch date
    if (isNaN(epoch)) {
        console.error('Epoch Date: Invalid Date');
        return { x: 0, y: 0, z: 0 };
    }
    const timeDifference = (currentDate - epoch) / (1000 * 3600 * 24); // Difference in days
    const n = Math.sqrt(mu / Math.pow(a, 3)); // Mean motion in radians per day
    const M0 = parseFloat(orbitalData.mean_anomaly) * Math.PI / 180; // Initial mean anomaly in radians
    let M = M0 + n * timeDifference; // Mean anomaly at the given date

    // Normalize M to be within 0 to 2π
    M = M % (2 * Math.PI);

    console.log('M:', M);

    // Solve Kepler's equation for eccentric anomaly, E
    let E = solveKeplersEquation(e, M);

    // True anomaly, v
    const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));

    // Distance to the Sun, r
    const r = a * (1 - e * Math.cos(E));

    // Heliocentric coordinates in the orbital plane
    const x = r * (Math.cos(Omega) * Math.cos(omega + v) - Math.sin(Omega) * Math.sin(omega + v) * Math.cos(I));
    const y = r * (Math.sin(Omega) * Math.cos(omega + v) + Math.cos(Omega) * Math.sin(omega + v) * Math.cos(I));
    const z = r * Math.sin(I) * Math.sin(omega + v);

    return { x, y, z };
}

function solveKeplersEquation(e, M) {
    let E = M;
    let delta;
    do {
        delta = E - e * Math.sin(E) - M;
        E = E - delta / (1 - e * Math.cos(E));
    } while (Math.abs(delta) > 1e-6);
    return E;
}

const getFakeAsteroidOrbitalPosition = async (asteroidId) => {
    // Simulated function to fetch asteroid position
    // In a real scenario, replace this with actual data fetching logic
    return {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        z: Math.random() * 1000
    };
};






// Placeholder function to fetch orbital data by ID
// In a real scenario, replace this with actual data fetching logic
const getOtbitalDatabyId = async (asteroidId) => {
    // Run the query to fetch the orbital data by ID
    const session = neo4jDriver.session({ database: 'asteroids' });
    const result = await session.run(
        'MATCH (n:Asteroid)-[r:HAS_ORBITAL_DATA]->(od:OrbitalData) WHERE n.id = $asteroidId RETURN n, r, od',
        { asteroidId: asteroidId }
    );
    session.close();

    // Process the result and extract the orbital data
    const record = result.records[0];
    const orbitalData = {
        semi_major_axis: record.get('od').properties.semi_major_axis,
        eccentricity: record.get('od').properties.eccentricity,
        inclination: record.get('od').properties.inclination,
        perihelion_argument: record.get('od').properties.perihelion_argument,
        ascending_node_longitude: record.get('od').properties.ascending_node_longitude,
        orbit_determination_date: record.get('od').properties.orbit_determination_date,
        orbital_period: record.get('od').properties.orbital_period,
        mean_anomaly: record.get('od').properties.mean_anomaly
    };

    return orbitalData;
}

module.exports = { getAsteroidOrbitalPosition, getFakeAsteroidOrbitalPosition, getOtbitalDatabyId };
