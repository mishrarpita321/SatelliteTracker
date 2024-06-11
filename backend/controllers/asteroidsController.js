const Asteroid = require('../models/Asteroid');
const { neo4jDriver } = require('../config/db');
const { getVisibleCountriesAndPositions } = require('../utils/visibilityHelper');

exports.getAllAsteroids = async (req, res) => {
    const { page = 1, limit = 10, search = '', sortKey = 'name', sortDirection = 'asc' } = req.query;

    try {
        // Build search query
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};

        // Determine sorting field and direction
        const sortFields = {
            name: 'name',
            diameter: 'estimated_diameter.kilometers.estimated_diameter_min',
            magnitude: 'absolute_magnitude_h',
            hazardous: 'is_potentially_hazardous_asteroid'
        };

        const sortField = sortFields[sortKey] || 'name';
        const sort = {
            [sortField]: sortDirection === 'asc' ? 1 : -1
        };

        // Fetch sorted and paginated data
        const asteroids = await Asteroid.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // Count the total documents
        const count = await Asteroid.countDocuments(query);

        res.json({
            asteroids,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalAsteroids: count
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching asteroids", error: error });
    }
};

exports.getAsteroidDetails = async (req, res) => {
    try {
        const asteroidId = req.params.id;
        const asteroid = await Asteroid.findById(asteroidId);

        if (!asteroid) {
            return res.status(404).json({ message: "Asteroid not found" });
        }

        const session = neo4jDriver.session({ database: 'asteroids' });
        const result = await session.run(
            'MATCH (n:Asteroid)-[r:HAS_CLOSE_APPROACH]->(cad:CloseApproachData) WHERE n.id = $id RETURN n, r, cad',
            { id: asteroidId }
        );

        session.close();

        if (result.records.length === 0) {
            return res.status(404).json({ message: "Close approach data not found" });
        }

        const approachData = result.records.map(record => record.get('cad').properties);

        res.json({ asteroid, approachData });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve asteroid details", error });
    }
};


exports.getAsteroidVisibility = async (req, res) => {
    try {
        // const asteroidId = req.params.id;
        const asteroidId = req.params.id;
        // const asteroidId = "2315020";
        console.log(asteroidId);
        const visibilityData = await getVisibleCountriesAndPositions(asteroidId);
        res.json({ visibilityData });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve visibility data", error });
    }
};

