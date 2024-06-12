const axios = require('axios');
const satellite = require('satellite.js');
const Satellite = require('../models/Satellite');
const { MongoClient } = require('mongodb');
const neo4jDriver = require('../config/db').neo4jDriver;

exports.fetchSatelliteTle = async (req, res) => {
    const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle`;
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            const data = response.data;
            const tleLines = data.split('\n');
            const tleSets = [];
            for (let i = 0; i < tleLines.length; i += 3) {
                const tleSet = tleLines.slice(i, i + 3).map(line => line.replace('\r', '').trim());

                if (tleSet.length === 3 && tleSet[0] && tleSet[1] && tleSet[2]) {
                    tleSets.push(tleSet);
                }
            }
            const satelliteLocations = [];
            for (const tleSet of tleSets) {
                const tleLine0 = tleSet[0];
                const tleLine1 = tleSet[1];
                const tleLine2 = tleSet[2];
                const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
                const noradCatId = satrec.satnum;

                satelliteLocations.push({
                    noradCatId: noradCatId,
                    satellite: tleLine0,
                    line1: tleLine1,
                    line2: tleLine2,
                    timestamp: new Date(),
                });
            }
            await saveDataInMongo(satelliteLocations);
            res.json("satelliteLocations saved successfully.");
            console.log("satelliteLocations saved successfully.");
        } else {
            throw new Error(`Request failed with status code ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

let satelliteData = [];
exports.fetchSatelliteData = async () => {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db('satellites');
        const groups = ['intelsat', 'iridium', 'starlink', 'other-comm'];
        for (const group of groups) {
            const collection = db.collection(group);
            satelliteData[group] = await collection.find().toArray();
        }
        client.close();
    } catch (error) {
        console.error('Error fetching satellite data:', error.message);
    }
}

// Calculate satellite positions from the stored data
exports.calculateSatellitePositions = async (group) => {
    
    const currentDate = new Date();
    // currentDate.setMilliseconds(currentDate.getMilliseconds() * 10000);
    
    // console.log(currentDate);
    // console.log(satelliteData);

    return (satelliteData[group] && satelliteData[group].map(data => {
        const { satellite: satname, line1, line2 } = data;
        const satrec = satellite.twoline2satrec(line1, line2);
        const positionAndVelocity = satellite.propagate(satrec, currentDate);
        const positionEci = positionAndVelocity.position;
        const noradCatId = satrec.satnum;

        if (!positionEci) {
            return null;
        }

        const gmst = satellite.gstime(currentDate);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const latitudeDeg = satellite.degreesLat(positionGd.latitude);
        const longitudeDeg = satellite.degreesLong(positionGd.longitude);
        const altitude = positionGd.height; // Convert km to meters if needed

        const orbittype = determineOrbitType(altitude);

        // const orbitPath = calculateOrbitPath(line1, line2, satrec);

        return {
            noradCatId: noradCatId,
            satname: satname,
            latitude: latitudeDeg,
            longitude: longitudeDeg,
            altitude: altitude,
            orbittype: orbittype,
            // orbitPath: orbitPath
        };
    }).filter(position => position !== null));
}

function determineOrbitType(altitude) {
    if (altitude < 1001) {
        return "Low Earth Orbit";
    } else if (altitude > 1000 && altitude < 35000) {
        return "Medium Earth Orbit";
    } else {
        return "Geostationary Orbit";
    }
}

exports.fetchAndStoreGroupSatelliteData = async (group) => {
    // const { group } = req.params;
    const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            const data = response.data;
            const tleLines = data.split('\n');
            const tleSets = [];
            for (let i = 0; i < tleLines.length; i += 3) {
                const tleSet = tleLines.slice(i, i + 3).map(line => line.replace('\r', '').trim());

                if (tleSet.length === 3 && tleSet[0] && tleSet[1] && tleSet[2]) {
                    tleSets.push(tleSet);
                }
            }
            const satelliteLocations = [];
            for (const tleSet of tleSets) {
                const tleLine0 = tleSet[0];
                const tleLine1 = tleSet[1];
                const tleLine2 = tleSet[2];
                const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
                const noradCatId = satrec.satnum;

                satelliteLocations.push({
                    noradCatId: noradCatId,
                    satellite: tleLine0,
                    line1: tleLine1,
                    line2: tleLine2,
                    timestamp: new Date(),
                });
            }
            await saveGroupDataInMongo(satelliteLocations, group);
            // res.json("satelliteLocations saved successfully.");
            console.log("satelliteLocations saved successfully.");
        } else {
            throw new Error(`Request failed with status code ${response.status}`);
        }
    } catch (error) {
        console.error(`Error fetching data for group ${group}:`, error.message);
        // res.status(500).send('Internal Server Error');
    }
};

const saveGroupDataInMongo = async (satelliteLocations, group) => {
    const mongo_url = process.env.MONGODB_URI;

    const client = new MongoClient(mongo_url);
    try {
        await client.connect();
        const db = client.db('satellites');
        const collection = db.collection(group);
        for (const satelliteLocation of satelliteLocations) {
            const { noradCatId, satellite, line1, line2 } = satelliteLocation;
            const existingData = await collection.findOne({ noradCatId });

            if (existingData) {
                const { satellite: existingSatellite, line1: existingLine1, line2: existingLine2 } = existingData;

                if (satellite !== existingSatellite || line1 !== existingLine1 || line2 !== existingLine2) {
                    await collection.updateOne({ noradCatId }, { $set: { satellite, line1, line2 } });
                    console.log(`Data updated for satellite ${noradCatId} in group ${group}`);
                } else {
                    console.log(`Data already up to date for satellite ${noradCatId} in group ${group}`);
                }
            } else {
                await collection.insertOne(satelliteLocation);
                console.log(`New record inserted for satellite ${noradCatId} in group ${group}`);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error('Failed to save location record.');
    } finally {
        await client.close();
    }
}

async function getSatelliteOrbitalParameters (satName) { // Assuming satellite name is passed as a URL parameter

    try {
        // Connect to MongoDB
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db('satellites');
        const collection = db.collection('starlink'); // Assuming 'starlink' collection

        // Fetch satellite TLE data
        const satelliteData = await collection.findOne({ satellite: satName });
        if (!satelliteData) {
            throw new Error('Satellite not found');
        }

        const { line1, line2 } = satelliteData;
        const satrec = satellite.twoline2satrec(line1, line2);
        const noradCatId = satrec.satnum;
        const epochYear = satrec.epochyr;
        const epochDay = satrec.epochdays;
        const epochDate = new Date(Date.UTC(2000 + epochYear, 0, 1));
        epochDate.setUTCDate(epochDate.getUTCDate() + epochDay - 1);

        // Extract mean motion, eccentricity, and inclination
        const meanMotion = satrec.no * 1440.0 / (2 * Math.PI); // converting rad/min to rev/day
        const eccentricity = satrec.ecco;
        const inclination = satrec.inclo * (180 / Math.PI); // converting rad to degrees

        // Calculate current position
        const currentDate = new Date();
        const positionAndVelocity = satellite.propagate(satrec, currentDate);
        const positionEci = positionAndVelocity.position;
        if (!positionEci) {
            throw new Error('Position not available');
        }

        const gmst = satellite.gstime(currentDate);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const latitudeDeg = satellite.degreesLat(positionGd.latitude);
        const longitudeDeg = satellite.degreesLong(positionGd.longitude);
        const altitude = positionGd.height; 

        // Close the client connection
        client.close();

        // Return satellite data
        return {
            latitude: latitudeDeg,
            longitude: longitudeDeg,
            altitude: altitude
        };
    } catch (error) {
        console.error('Error fetching satellite data:', error.message);
        throw error;
    }
}
exports.fetchOrbitalDetailsFromNeo4j = async (objectName) => {
    const session = neo4jDriver.session({ database: 'satellites' });

    const query = `
        MATCH (Satellite { OBJECT_NAME: $objectName })-[rel:OBSERVED]->(orbitalDetails)
        RETURN orbitalDetails.mean_motion AS meanMotion, 
               orbitalDetails.eccentricity AS eccentricity, 
               orbitalDetails.inclination AS inclination, 
               orbitalDetails.epoch AS epoch, 
               Satellite.OBJECT_NAME AS objectName, 
               Satellite.norad_id AS noradId
        ORDER BY rel.EPOCH DESC
        LIMIT 1
    `;
    const params = { objectName };

    try {
        const result = await session.run(query, params);
        let satelliteData = null;

        if (result.records.length > 0) {
            const record = result.records[0];
            satelliteData = {
                meanMotion: record.get('meanMotion'),
                eccentricity: record.get('eccentricity'),
                inclination: record.get('inclination'),
                epoch: record.get('epoch'),
                objectName: record.get('objectName'),
                noradId: record.get('noradId')
            };

            // Fetch latitude, longitude, and altitude from MongoDB
            const satelliteParameters = await getSatelliteOrbitalParameters(objectName);

            satelliteData = {
                ...satelliteData,
                latitude: satelliteParameters.latitude,
                longitude: satelliteParameters.longitude,
                altitude: satelliteParameters.altitude
            };
        }
        return satelliteData;
    } catch (error) {
        console.error('Error fetching data from Neo4j:', error.message);
        throw error;
    } finally {
        await session.close();
    }
};

exports.getPost = async (req, res) => {
    // const { satName } = req.body;
    try {
        const satelliteData = await this.fetchOrbitalDetailsFromNeo4j('STARLINK-5852');
        res.json(satelliteData);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

exports.driftDetectionFn = async (satelliteData) => {
    const session = neo4jDriver.session({ database: 'satellites' });

    // Define drift detection thresholds
    const thresholds = {
        mean_motion: 0.05,
        eccentricity: 0.001,
        inclination: 0.1
    };
    // Construct the drift detection and epoch check part of the query
    const driftCheckQuery = `
    OPTIONAL MATCH (s:Satellite {norad_id: $norad_id})-[:OBSERVED]->(last)
    WITH s, last
    ORDER BY last.epoch DESC
    LIMIT 1
    RETURN last,
    s IS NULL AS firstInsertion,
    last IS NULL OR last.epoch <> $epoch AS epochUpdated,
    {
        mean_motion: abs(last.mean_motion - $mean_motion) > $mean_motion_threshold,
        eccentricity: abs(last.eccentricity - $eccentricity) > $eccentricity_threshold,
            inclination: abs(last.inclination - $inclination) > $inclination_threshold
        } AS driftDetails`;

    try {
        // Run the drift detection query
        const checkResult = await session.run(driftCheckQuery, {
            OBJECT_NAME: satelliteData.OBJECT_NAME,
            norad_id: satelliteData.norad_id,
            epoch: satelliteData.epoch,
            mean_motion: satelliteData.mean_motion,
            eccentricity: satelliteData.eccentricity,
            inclination: satelliteData.inclination,
            mean_motion_threshold: thresholds.mean_motion,
            eccentricity_threshold: thresholds.eccentricity,
            inclination_threshold: thresholds.inclination
        });

        const record = checkResult.records[0];
        const firstInsertion = record.get('firstInsertion');
        const driftDetails = record.get('driftDetails');
        const driftDetected = detectDrift(driftDetails);

        if (firstInsertion || driftDetected) {

            if (driftDetected) {
                const driftQuery = `
                MATCH (last:Satellite { norad_id: $norad_id })
                WITH last
                ORDER BY last.epoch DESC
                LIMIT 1
                CREATE (orb:ORBITAL_DETAILS {
                    epoch: $epoch,
                    mean_motion: $mean_motion,
                    eccentricity: $eccentricity,
                    inclination: $inclination,
                    driftDetails: $driftDetails
                })
                CREATE (last)-[:OBSERVED]->(orb)
                `;

                await session.run(driftQuery, {
                    OBJECT_NAME: satelliteData.OBJECT_NAME,
                    norad_id: satelliteData.norad_id,
                    epoch: satelliteData.epoch,
                    mean_motion: satelliteData.mean_motion,
                    eccentricity: satelliteData.eccentricity,
                    inclination: satelliteData.inclination,
                    driftDetails: JSON.stringify(driftDetails)
                });
                console.log(`Drift detected for ${satelliteData.OBJECT_NAME}`);
                return `Drift detected for ${satelliteData.OBJECT_NAME}`;
            } else if (firstInsertion) {
                // Create/update the node and relationships if it's the first data point or drift is detected
                const query = `
                CREATE (current:Satellite {
                    OBJECT_NAME: $OBJECT_NAME,
                    norad_id: $norad_id
                })
                CREATE (orb:ORBITAL_DETAILS {
                    epoch: $epoch,
                    mean_motion: $mean_motion,
                    eccentricity: $eccentricity,
                    inclination: $inclination
                })
                CREATE (current)-[:OBSERVED]->(orb)
                RETURN current
                `;

                const result = await session.run(query, satelliteData);
                // const currentData = result.records[0].get('current').properties;
                logger.error('First data point stored.');
            } else {
                // logger.info('No significant drift detected');
                console.log('No significant drift detected');
                return 'No significant drift detected';
            }
        } else {
            console.log('No new node created as there is no significant drift or epoch update');
            return 'No drift detected';
            // logger.info('No new node created as there is no significant drift or epoch update');
        }
    } catch (error) {
        logger.error('Error saving to Neo4j:', error);
    } finally {
        await session.close();
    }
};

function detectDrift(driftDetails) {
    for (const key in driftDetails) {
        if (driftDetails[key]) {
            return true;
        }
    }
    return false;
}