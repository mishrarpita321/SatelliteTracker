const axios = require('axios');
const satellite = require('satellite.js');
const Satellite = require('../models/Satellite');
const { MongoClient } = require('mongodb');

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
        const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
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

    return satelliteData[group].map(data => {
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
    }).filter(position => position !== null);
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

// Calculate orbit path for a satellite
exports.calculateOrbitPath = async (line1, line2, satrec) => {
    const currentDate = new Date();
    const gmst = satellite.gstime(currentDate);
    const positions = [];

    for (let i = 0; i < 1440; i += 10) { // Calculate positions every 10 minutes for one day
        const futureDate = new Date(currentDate.getTime() + i * 60000);
        const positionAndVelocity = satellite.propagate(satrec, futureDate);
        const positionEci = positionAndVelocity.position;

        if (!positionEci) continue;

        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const latitudeDeg = satellite.degreesLat(positionGd.latitude);
        const longitudeDeg = satellite.degreesLong(positionGd.longitude);
        const altitude = positionGd.height * 1000; // Convert km to meters

        positions.push({
            longitude: longitudeDeg,
            latitude: latitudeDeg,
            altitude: altitude
        });
    }

    return positions;
}

async function saveDataInMongo(satelliteLocations) {
    try {
        for (const satelliteLocation of satelliteLocations) {
            const { noradCatId, satellite, line1, line2 } = satelliteLocation;
            const existingData = await Satellite.findOne({ noradCatId });

            if (existingData) {
                const { satellite: existingSatellite, line1: existingLine1, line2: existingLine2 } = existingData;

                if (satellite !== existingSatellite || line1 !== existingLine1 || line2 !== existingLine2) {
                    existingData.satellite = satellite;
                    existingData.line1 = line1;
                    existingData.line2 = line2;
                    await existingData.save();
                    console.log(`Data updated for satellite ${noradCatId}`);
                } else {
                    console.log(`Data already up to date for satellite ${noradCatId}`);
                }
            } else {
                const record = new Satellite(satelliteLocation);
                await record.save();
                console.log(`New record inserted for satellite ${noradCatId}`);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error('Failed to save location record.');
    }
}

exports.fetchSatellitePositionById = async (noradCatId) => {
    const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradCatId}&FORMAT=tle`;

    try {
        const response = await axios.get(url);

        if (response.status === 200) {
            const data = response.data.trim();
            const tleLines = data.split('\n');

            if (tleLines.length === 3) {
                const tle0 = tleLines[0].replace('\r', '').trim();
                const tle1 = tleLines[1].replace('\r', '').trim();
                const tle2 = tleLines[2].replace('\r', '').trim();

                const satrec = satellite.twoline2satrec(tle1, tle2);
                const currentDate = new Date();
                const positionAndVelocity = satellite.propagate(satrec, currentDate);
                const positionEci = positionAndVelocity.position;

                if (!positionEci) {
                    throw new Error('No position data available for the satellite');
                }

                const gmst = satellite.gstime(currentDate);
                const positionGd = satellite.eciToGeodetic(positionEci, gmst);

                const latitudeDeg = satellite.degreesLat(positionGd.latitude);
                const longitudeDeg = satellite.degreesLong(positionGd.longitude);
                const altitude = positionGd.height;

                return {
                    satellite: tle0,
                    latitude: latitudeDeg,
                    longitude: longitudeDeg,
                    altitude: altitude,
                };
            } else {
                throw new Error('Invalid TLE data received');
            }
        } else {
            throw new Error(`Request failed with status code ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching satellite data:', error.message);
        throw error;
    }
}

exports.fetchSatelliteDataById = async (noradCatId) => {
    try {
        const satelliteData = await Satellite.findOne({ noradCatId });
        if (!satelliteData) {
            throw new Error('No data found for the satellite');
        }

        return satelliteData;
    } catch (error) {
        console.error('Error fetching satellite data:', error.message);
        throw error;
    }
}

// create a function that catches the satellite name in the URL and returns the satellite position data
exports.predictSatellitePositionByName = async (req, res) => {
    const { satellites } = req.body;
    try {
        let satelliteData;
        if (Array.isArray(satellites) && satellites.length > 1) {
            satelliteData = await Satellite.find({ satellite: { $in: satellites } });
        } else {
            satelliteData = await Satellite.findOne({ satellite: satellites[0] });
        }

        const satellitePositions = [];

        if (!satelliteData || (Array.isArray(satelliteData) && satelliteData.length === 0)) {
            return res.status(404).json({ message: "No data found for the satellite(s)" });
        }

        const currentDate = new Date();

        const processSatelliteData = (data) => {
            const tle0 = data.satellite;
            const tle1 = data.line1;
            const tle2 = data.line2;

            const satrec = satellite.twoline2satrec(tle1, tle2);
            const positionAndVelocity = satellite.propagate(satrec, currentDate);
            const positionEci = positionAndVelocity.position;

            if (!positionEci) {
                return null;
            }

            const gmst = satellite.gstime(currentDate);
            const positionGd = satellite.eciToGeodetic(positionEci, gmst);

            const latitudeDeg = satellite.degreesLat(positionGd.latitude);
            const longitudeDeg = satellite.degreesLong(positionGd.longitude);
            const altitude = positionGd.height;

            return {
                satellite: tle0,
                latitude: latitudeDeg,
                longitude: longitudeDeg,
                altitude: altitude,
            };
        };

        if (Array.isArray(satelliteData)) {
            for (const data of satelliteData) {
                const position = processSatelliteData(data);
                if (position) satellitePositions.push(position);
            }
        } else {
            const position = processSatelliteData(satelliteData);
            if (position) satellitePositions.push(position);
        }

        res.json({ satellitePositions });
    } catch (error) {
        console.error('Error predicting satellite position:', error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// create a function that fetches tle from celestrack api : https://celestrak.org/NORAD/elements/gp.php?GROUP=intelsat&FORMAT=tle
// store the satellite name, line1 and line2 in the mongo database
// name the collection as 'intelsat' and the database as 'satellites' same db

exports.fetchAndStoreGroupSatelliteData = async (req, res) => {
    const { group } = req.params;
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
                    console.log(`Data updated for satellite ${noradCatId}`);
                } else {
                    console.log(`Data already up to date for satellite ${noradCatId}`);
                }
            } else {
                await collection.insertOne(satelliteLocation);
                console.log(`New record inserted for satellite ${noradCatId}`);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error('Failed to save location record.');
    } finally {
        await client.close();
    }
}

exports.predictSatelliteGroupPositions = async (req, res) => {
    const { group } = req.body;
    const mongo_url = process.env.MONGODB_URI;

    try {
        const client = new MongoClient(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db('satellites');
        const collection = db.collection(group);

        const satelliteData = await collection.find().toArray();

        if (!satelliteData || satelliteData.length === 0) {
            return res.status(404).json({ message: "No data found for the group" });
        }

        const currentDate = new Date();
        const satellitePositions = satelliteData.map(data => {
            const { satellite: satname, line1, line2 } = data;
            const satrec = satellite.twoline2satrec(line1, line2);
            const positionAndVelocity = satellite.propagate(satrec, currentDate);
            const positionEci = positionAndVelocity.position;

            if (!positionEci) {
                return null;
            }

            const gmst = satellite.gstime(currentDate);
            const positionGd = satellite.eciToGeodetic(positionEci, gmst);

            const latitudeDeg = satellite.degreesLat(positionGd.latitude);
            const longitudeDeg = satellite.degreesLong(positionGd.longitude);
            const altitude = positionGd.height;

            const orbitType = determineOrbitType(altitude);

            return {
                satname: satname,
                latitude: latitudeDeg,
                longitude: longitudeDeg,
                altitude: altitude,
                orbitType: orbitType,
            };
        }).filter(position => position !== null);

        res.json({ satellitePositions });
    } catch (error) {
        console.error('Error predicting satellite positions:', error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};