// Function to solve Kepler's equation
function solveKeplersEquation(e, M) {
    let E = M;
    let delta;
    do {
        delta = E - e * Math.sin(E) - M;
        E = E - delta / (1 - e * Math.cos(E));
    } while (Math.abs(delta) > 1e-6);
    return E;
}

// Function to get planet or asteroid orbital position
export const getOrbitalPosition = (orbitalData, date) => {
    const mu = 132712440018; // Standard gravitational parameter for the sun in km^3/s^2
    const a = parseFloat(orbitalData.semi_major_axis) * 149597870.7; // Semi-major axis in km
    const e = parseFloat(orbitalData.eccentricity);
    const I = parseFloat(orbitalData.inclination) * Math.PI / 180; // Inclination in radians
    const omega = parseFloat(orbitalData.perihelion_argument) * Math.PI / 180; // Argument of periapsis in radians
    const Omega = parseFloat(orbitalData.ascending_node_longitude) * Math.PI / 180; // Longitude of ascending node in radians

    // Convert date string to Date object if necessary
    const currentDate = (typeof date === 'string') ? new Date(date) : date;
    console.log('currentDate:', currentDate);

    // Calculate the mean anomaly at the given date
    const epoch = new Date(orbitalData.orbit_determination_date); // Epoch date
    if (isNaN(epoch)) {
        console.error('Epoch Date: Invalid Date');
        return { x: 0, y: 0, z: 0 };
    }
    const timeDifference = (currentDate - epoch) / (1000 * 3600 * 24); // Difference in days
    console.log('timeDifference (days):', timeDifference);

    const n = Math.sqrt(mu / Math.pow(a, 3)); // Mean motion in radians per second
    console.log('mean motion (radians per second):', n);

    const M0 = parseFloat(orbitalData.mean_anomaly) * Math.PI / 180; // Initial mean anomaly in radians
    let M = M0 + n * timeDifference; // Mean anomaly at the given date
    console.log('Initial Mean Anomaly (M0):', M0);
    console.log('Mean Anomaly at current date (M):', M);

    // Normalize M to be within 0 to 2π
    M = M % (2 * Math.PI);
    console.log('Normalized Mean Anomaly (M):', M);

    // Solve Kepler's equation for eccentric anomaly, E
    let E = solveKeplersEquation(e, M);
    console.log('Eccentric Anomaly (E):', E);

    // True anomaly, v
    const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    console.log('True Anomaly (v):', v);

    // Distance to the Sun, r
    const r = a * (1 - e * Math.cos(E));
    console.log('Distance to the Sun (r):', r);

    // Heliocentric coordinates in the orbital plane
    const x = r * (Math.cos(Omega) * Math.cos(omega + v) - Math.sin(Omega) * Math.sin(omega + v) * Math.cos(I));
    const y = r * (Math.sin(Omega) * Math.cos(omega + v) + Math.cos(Omega) * Math.sin(omega + v) * Math.cos(I));
    const z = r * Math.sin(I) * Math.sin(omega + v);
    console.log('x:', x, 'y:', y, 'z:', z);

    return { x, y, z };
}

export default getOrbitalPosition;
