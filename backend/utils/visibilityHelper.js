const { neo4jDriver } = require('../config/db');

// Converts degrees to radians
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Converts radians to degrees
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// Calculate the latitude and longitude from miss distance
function calculateLatLonFromMissDistance(initialLat, initialLon, distanceKm, bearing) {
    const R = 6371; // Radius of the Earth in kilometers
    const bearingRad = toRadians(bearing);

    const lat1 = toRadians(initialLat);
    const lon1 = toRadians(initialLon);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceKm / R) +
                           Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearingRad));
    const lon2 = lon1 + Math.atan2(Math.sin(bearingRad) * Math.sin(distanceKm / R) * Math.cos(lat1),
                                   Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2));

    return {
        latitude: toDegrees(lat2),
        longitude: toDegrees(lon2)
    };
}

async function getCloseApproachData(asteroidId) {
    console.log('Fetching close approach data for asteroid:', asteroidId);
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
    console.log(closeApproachData);

    const session = neo4jDriver.session({ database: 'neo4j' });

    try {
        const results = [];

        for (const approach of closeApproachData) {
            // Placeholder initial coordinates and bearing for calculation
            const initialLat = 0; // Replace with actual latitude
            const initialLon = 0; // Replace with actual longitude
            const bearing = 0; // Replace with actual bearing

            const { latitude: approachLatitude, longitude: approachLongitude } = calculateLatLonFromMissDistance(
                initialLat, initialLon, parseFloat(approach.miss_distance_kilometers), bearing
            );

            const searchRadiusKm = 500; // Search radius in kilometers
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

            const visibleCountries = result.records.map(record => record.get('country'));

            results.push({
                closeApproachDate: approach.close_approach_date,
                position: { latitude: approachLatitude, longitude: approachLongitude },
                visibleCountries
            });
        }

        return results;
    } finally {
        await session.close();
    }
}

module.exports = { getVisibleCountriesAndPositions };
