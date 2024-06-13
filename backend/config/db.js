// In db.js
const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
const redis = require('redis');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);
const redisClient  = redis.createClient({
  password: 'NdFftle66xQoGwi1QvhJND4ht4KI73KO',
  socket: {
      host: 'redis-19176.c328.europe-west3-1.gce.redns.redis-cloud.com',
      port: 19176
  }
});

redisClient.on('error', (err) => console.error('Redis connection error:', err));
(async () => {
  await redisClient.connect();
})();

module.exports = {
  connectDB: async function() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }

    try {
      await driver.verifyConnectivity();
      console.log('Neo4j connected');
    } catch (error) {
      console.error('Neo4j connection error:', error);
    }

    try {
      await redisClient.ping();
      console.log('Redis connected');
    } catch (error) {
      console.error('Redis connection error:', error);
    }

  },
  neo4jDriver: driver,
  redisClient: redisClient,
};
