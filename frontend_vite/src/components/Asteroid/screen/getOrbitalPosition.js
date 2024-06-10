function solveKeplersEquation(e, M) {
    let E = M;
    let delta;
    do {
        delta = E - e * Math.sin(E) - M;
        E = E - delta / (1 - e * Math.cos(E));
    } while (Math.abs(delta) > 1e-6);
    return E;
}

export const getOrbitalPosition = (orbitalData, date) => {

    // date = new Date('2024-10-10T00:00:00Z').toISOString();
    
    




    // date = new Date().toISOString();
    const mu = 132712440018; // Standard gravitational parameter for the sun in km^3/s^2
    const a = parseFloat(orbitalData.semi_major_axis) * 149597870.7; // Semi-major axis in km
    const e = parseFloat(orbitalData.eccentricity);
    const I = parseFloat(orbitalData.inclination) * Math.PI / 180; // Inclination in radians
    const omega = parseFloat(orbitalData.perihelion_argument) * Math.PI / 180; // Argument of periapsis in radians
    const Omega = parseFloat(orbitalData.ascending_node_longitude) * Math.PI / 180; // Longitude of ascending node in radians

    const currentDate = new Date(date);
    const currentDateCET = new Date(currentDate.toLocaleString("en-US", { timeZone: "CET" }));
    const epoch = new Date(orbitalData.orbit_determination_date); // Epoch date
    const timeDifference = (currentDateCET - epoch) / (1000 * 3600 * 24); // Difference in days
    // const n = Math.sqrt(mu / Math.pow(a, 3)); // Mean motion in radians per day
    const n = Math.sqrt(mu / Math.pow(a, 3)) * 86400; // Mean motion in radians per day

    const M0 = parseFloat(orbitalData.mean_anomaly) * Math.PI / 180; // Initial mean anomaly in radians
    let M = M0 + n * timeDifference; // Mean anomaly at the given date

    console.log('currentDate:', currentDateCET);
    console.log('epoch:', epoch);

    M = M % (2 * Math.PI);

    let E = solveKeplersEquation(e, M);

    const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    const r = a * (1 - e * Math.cos(E));

    const x = r * (Math.cos(Omega) * Math.cos(omega + v) - Math.sin(Omega) * Math.sin(omega + v) * Math.cos(I));
    const y = r * (Math.sin(Omega) * Math.cos(omega + v) + Math.cos(Omega) * Math.sin(omega + v) * Math.cos(I));
    const z = r * Math.sin(I) * Math.sin(omega + v);

    return { x, y, z };
}


export default getOrbitalPosition;
