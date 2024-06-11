// In db.js
const mongoose = require('mongoose');
// const neo4j = require('neo4j-driver');
// const driver = neo4j.driver(
//   process.env.NEO4J_URI,
//   neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
// );

module.exports = {
  connectDB: async function() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }

    // try {
    //   await driver.verifyConnectivity();
    //   console.log('Neo4j connected');
    // } catch (error) {
    //   console.error('Neo4j connection error:', error);
    // }
  },
  // neo4jDriver: driver
};
