const { neo4jDriver, redisClient } = require('../config/db');

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
    let eccentricAnomaly = meanAnomaly;
    const epsilon = 1e-6;

    while (true) {
        const deltaE = (meanAnomaly + eccentricity * Math.sin(eccentricAnomaly) - eccentricAnomaly) / (1 - eccentricity * Math.cos(eccentricAnomaly));
        eccentricAnomaly += deltaE;
        if (Math.abs(deltaE) < epsilon) break;
    }

    const trueAnomaly = 2 * Math.atan2(Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2), Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2));
    return trueAnomaly;
}

// Calculate the position in the orbital plane
function calculatePosition(orbitalElements, epoch, timeOfCloseApproach) {
    const { semi_major_axis: a, eccentricity: e, inclination: i, ascending_node_longitude: Ω, perihelion_argument: ω, mean_anomaly: M, mean_motion: n, epoch_osculation: t0 } = orbitalElements;

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
    const xOrb = r * Math.cos(trueAnomaly);
    const yOrb = r * Math.sin(trueAnomaly);

    const x = xOrb * (Math.cos(ΩRad) * Math.cos(ωRad) - Math.sin(ΩRad) * Math.sin(ωRad) * Math.cos(iRad)) - yOrb * (Math.cos(ΩRad) * Math.sin(ωRad) + Math.sin(ΩRad) * Math.cos(ωRad) * Math.cos(iRad));
    const y = xOrb * (Math.sin(ΩRad) * Math.cos(ωRad) + Math.cos(ΩRad) * Math.sin(ωRad) * Math.cos(iRad)) + yOrb * (Math.sin(ΩRad) * Math.sin(ωRad) - Math.cos(ΩRad) * Math.cos(ωRad) * Math.cos(iRad));
    const z = xOrb * (Math.sin(ωRad) * Math.sin(iRad)) + yOrb * (Math.cos(ωRad) * Math.sin(iRad));

    const latitude = toDegrees(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const longitude = toDegrees(Math.atan2(y, x));

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

    const cacheKey = `visibility_${asteroidId}`;
    const cachedResult = await redisClient.get(cacheKey);

    if (cachedResult) {
        console.log('getting result from cache ' + cacheKey)
        return JSON.parse(cachedResult);
    }


    const closeApproachData = await getCloseApproachData(asteroidId);
    const orbitalElements = await getOrbitalElementsFromNeo4j(asteroidId);

    const session = neo4jDriver.session({ database: 'neo4j' });

    try {
        const results = [];
        const searchRadius = 500 * 1000; // Search radius in meters

        for (const approach of closeApproachData) {
            console.log(approach);
            const timeOfCloseApproach = parseFloat(approach.epoch_date_close_approach); // Julian date of close approach
            const { latitude: approachLatitude, longitude: approachLongitude } = calculatePosition(orbitalElements, orbitalElements.epoch_osculation, timeOfCloseApproach);

            const result = await session.run(
                `
                WITH point({latitude: $approachLatitude, longitude: $approachLongitude}) AS givenPoint
                MATCH (p:Point)
                WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
                WITH p, point.distance(givenPoint, point({latitude: p.latitude, longitude: p.longitude})) AS dist
                WHERE dist <= $searchRadius
                RETURN DISTINCT p.country_code AS country, MIN(dist) AS minDistance
                `,
                { approachLatitude, approachLongitude, searchRadius }
            );

            const visibleCountries = result.records
                .map(record => ({
                    country: record.get('country'),
                    distance: record.get('minDistance')
                }))
                .filter(countryData => countryData.country !== null);

            results.push({
                closeApproachDate: approach.close_approach_date,
                position: { latitude: approachLatitude, longitude: approachLongitude },
                visibleCountries,
                searchRadius
            });
        }
        await redisClient.set(cacheKey, JSON.stringify(results), 'EX', 86400); // Cache for 24 hours

        return results;
    } finally {
        await session.close();
    }
}

module.exports = { getVisibleCountriesAndPositions };
