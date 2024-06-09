const fetchSatelliteData = require("../utils/fetchSatelliteData");
const neo4jDriver = require('../config/db').neo4jDriver;
// const Satellite = require('../models/Satellite');
const logger = require('../utils/logger'); // Ensure this path is correct

exports.fetchAndStoreSatelliteData = async (req, res) => {
    try {
        const satellites = await fetchSatelliteData();
        if (!satellites || satellites.length === 0) {
            return res.status(404).json({ message: "No satellite data found" });
        }

        for (const satellite of satellites) {
            // await saveToMongoDB({
            //     norad_id: satellite.NORAD_CAT_ID,
            //     object_name: satellite.OBJECT_NAME,
            //     object_id: satellite.OBJECT_ID,
            //     classification_type: satellite.CLASSIFICATION_TYPE
            // });

            await saveToNeo4j({
                OBJECT_NAME: satellite.OBJECT_NAME,
                norad_id: satellite.NORAD_CAT_ID,
                epoch: satellite.EPOCH,
                // epoch: '2024-06-02T09:26:40.489152',
                mean_motion: satellite.MEAN_MOTION,
                eccentricity: satellite.ECCENTRICITY,
                inclination: satellite.INCLINATION,
                ra_of_asc_node: satellite.RA_OF_ASC_NODE,
                arg_of_pericenter: satellite.ARG_OF_PERICENTER,
                mean_anomaly: satellite.MEAN_ANOMALY
            });
        }

        res.status(200).json({ message: "Satellites data fetched and stored successfully", satellites: satellites });
    } catch (error) {
        res.status(500).json({ message: "Error fetching and storing satellite data", error: error.toString() });
    }
};

exports.saveToNeo4j = async (satelliteData) => {
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
}


exports.getLatestOrbitalDetails = async (req, res) => {
    const { OBJECT_NAME } = req.params;
    const session = driver.session();

    try {
        const result = await session.run(
            `
      MATCH (Satellite { OBJECT_NAME: $OBJECT_NAME })-[rel:OBSERVED]->(ORBITAL_DETAILS)
      RETURN Satellite, rel, ORBITAL_DETAILS
      ORDER BY rel.EPOCH DESC
      LIMIT 1
      `,
            { OBJECT_NAME }
        );

        const singleRecord = result.records[0];
        const node = singleRecord.get(0);

        res.json(node.properties);
    } catch (error) {
        console.error('Error querying Neo4j:', error);
        res.status(500).json({ error: 'Error querying Neo4j' });
    } finally {
        await session.close();
    }
}

function detectDrift(driftDetails) {
    for (const key in driftDetails) {
        if (driftDetails[key]) {
            return true;
        }
    }
    return false;
}

// async function saveToMongoDB(satelliteData) {
//     try {
//         const satellite = await Satellite.findOneAndUpdate(
//             { norad_id: satelliteData.norad_id },
//             satelliteData,
//             { new: true, upsert: true }
//         );
//         console.log('Saved to MongoDB');
//     } catch (error) {
//         console.error('Error saving to MongoDB:', error);
//         throw error; // Re-throw the error to handle it in the calling function
//     }
// }