const Asteroid = require('../models/Asteroid');

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
