const { neo4jDriver } = require('../config/db');

// Converts degrees to radians
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Converts radians to degrees
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// Calculate the true anomaly from mean anomaly and eccentricity
function calculateTrueAnomaly(meanAnomaly, eccentricity) {
    console.log('meanAnomaly: ', meanAnomaly, 'eccentricity: ', eccentricity)
    let eccentricAnomaly = meanAnomaly;
    const epsilon = 1e-6;

    while (true) {
        const deltaE = (meanAnomaly + eccentricity * Math.sin(eccentricAnomaly) - eccentricAnomaly) / (1 - eccentricity * Math.cos(eccentricAnomaly));
        eccentricAnomaly += deltaE;
        if (Math.abs(deltaE) < epsilon) break;
    }
    console.log('eccentricAnomaly: ', eccentricAnomaly)

    const trueAnomaly = 2 * Math.atan2(Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2), Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2));
    console.log('trueAnomaly: ', trueAnomaly)
    return trueAnomaly;
}

// Calculate the position in the orbital plane
function calculatePosition(orbitalElements, epoch, timeOfCloseApproach) {
    const { semi_major_axis: a, eccentricity: e, inclination: i, ascending_node_longitude: Ω, perihelion_argument: ω, mean_anomaly: M, mean_motion: n, epoch_osculation: t0 } = orbitalElements;
    console.log('semi_major_axis: ', a, 'eccentricity: ', e, 'inclination: ', i, 'ascending_node_longitude: ', Ω, 'perihelion_argument: ', ω, 'mean_anomaly: ', M, 'mean_motion: ', n, 'epoch_osculation: ', t0, 'epoch: ', epoch, 'timeOfCloseApproach: ', timeOfCloseApproach)
    const iRad = toRadians(parseFloat(i));
    const ΩRad = toRadians(parseFloat(Ω));
    const ωRad = toRadians(parseFloat(ω));
    const M0 = toRadians(parseFloat(M));
    const t0JD = parseFloat(t0);
    const epochJD = parseFloat(epoch);

    const dt = (timeOfCloseApproach - t0JD) / 36525;

    const meanAnomalyCloseApproach = M0 + toRadians(n) * dt;

    const trueAnomaly = calculateTrueAnomaly(meanAnomalyCloseApproach, e);

    const r = a * (1 - e * Math.cos(trueAnomaly));
    console.log('r: ', r)
    const xOrb = r * Math.cos(trueAnomaly);
    const yOrb = r * Math.sin(trueAnomaly);
    console.log('xOrb: ', xOrb, 'yOrb: ', yOrb)

    const x = xOrb * (Math.cos(ΩRad) * Math.cos(ωRad) - Math.sin(ΩRad) * Math.sin(ωRad) * Math.cos(iRad)) - yOrb * (Math.cos(ΩRad) * Math.sin(ωRad) + Math.sin(ΩRad) * Math.cos(ωRad) * Math.cos(iRad));
    const y = xOrb * (Math.sin(ΩRad) * Math.cos(ωRad) + Math.cos(ΩRad) * Math.sin(ωRad) * Math.cos(iRad)) + yOrb * (Math.sin(ΩRad) * Math.sin(ωRad) - Math.cos(ΩRad) * Math.cos(ωRad) * Math.cos(iRad));
    const z = xOrb * (Math.sin(ωRad) * Math.sin(iRad)) + yOrb * (Math.cos(ωRad) * Math.sin(iRad));
    console.log('x: ', x, 'y: ', y, 'z: ', z)
    const latitude = toDegrees(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const longitude = toDegrees(Math.atan2(y, x));
    console.log('latitude: ', latitude, 'longitude: ', longitude)

    return { latitude, longitude };
}

async function getOrbitalElementsFromNeo4j(asteroidId) {
    const session = neo4jDriver.session({ database: 'asteroids' });
    try {
        const result = await session.run(
            'MATCH (n:Asteroid)-[r:HAS_ORBITAL_DATA]->(od:OrbitalData) WHERE n.id = $id RETURN od',
            { id: asteroidId }
        );

        if (result.records.length === 0) {
            throw new Error("Orbital data not found");
        }

        return result.records[0].get('od').properties;
    } finally {
        await session.close();
    }
}

async function getCloseApproachData(asteroidId) {
    const session = neo4jDriver.session({ database: 'asteroids' });
    try {
        const result = await session.run(
            'MATCH (n:Asteroid)-[r:HAS_CLOSE_APPROACH]->(cad:CloseApproachData) WHERE n.id = $id RETURN cad',
            { id: asteroidId }
        );

        if (result.records.length === 0) {
            throw new Error("Close approach data not found");
        }

        return result.records.map(record => record.get('cad').properties);
    } finally {
        await session.close();
    }
}

async function getVisibleCountriesAndPositions(asteroidId) {
    const closeApproachData = await getCloseApproachData(asteroidId);
    const orbitalElements = await getOrbitalElementsFromNeo4j(asteroidId);

    const session = neo4jDriver.session({ database: 'neo4j' });

    try {
        const results = [];
        const searchRadiusKm = 500; // Search radius in kilometers

        for (const approach of closeApproachData) {
            const timeOfCloseApproach = parseFloat(approach.epoch_date_close_approach); // Julian date of close approach
            const { latitude: approachLatitude, longitude: approachLongitude } = calculatePosition(orbitalElements, orbitalElements.epoch_osculation, timeOfCloseApproach);

            console.log('approachLatitude: ', approachLatitude, 'approachLongitude: ', approachLongitude)
            const searchRadiusDegrees = searchRadiusKm / 111; // Convert km to approximate degrees

            const result = await session.run(
                `
                WITH point({latitude: $approachLatitude, longitude: $approachLongitude}) AS givenPoint,
                     $searchRadiusDegrees AS searchRadiusDegrees,
                     $searchRadiusKm AS searchRadiusKm
                MATCH (p:Point)
                WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
                  AND p.latitude >= givenPoint.y - searchRadiusDegrees
                  AND p.latitude <= givenPoint.y + searchRadiusDegrees
                  AND p.longitude >= givenPoint.x - searchRadiusDegrees
                  AND p.longitude <= givenPoint.x + searchRadiusDegrees
                WITH p, point.distance(givenPoint, point({latitude: p.latitude, longitude: p.longitude})) AS dist
                WHERE dist <= searchRadiusKm * 1000 // Convert km to meters
                RETURN DISTINCT p.country_code AS country
                `,
                { approachLatitude, approachLongitude, searchRadiusDegrees, searchRadiusKm }
            );

            const visibleCountries = result.records
                .map(record => record.get('country'))
                .filter(country => country !== null);

            results.push({
                closeApproachDate: approach.close_approach_date,
                position: { latitude: approachLatitude, longitude: approachLongitude },
                visibleCountries,
                searchRadiusKm
            });
        }

        return results;
    } finally {
        await session.close();
    }
}

module.exports = { getVisibleCountriesAndPositions };
