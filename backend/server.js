require('dotenv').config();
const http = require('http');
const cors = require('cors');
const express = require('express');
const { connectDB } = require('./config/db');
const driftRoutes = require('./routes/driftRoutes');
const asteroidRoutes = require('./routes/asteroidRoutes');
const { setupWebSocketServer } = require('./middleware/webSocketMiddleware');
const { sendTestNotification } = require('./controllers/notificationController');
const { fetchSatelliteData, calculateSatellitePositions } = require('./controllers/driftSatellitePositions');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Middleware
app.use('/api/drift', driftRoutes);
app.use('/api/asteroids',asteroidRoutes);
app.post('/api/sendNotification', sendTestNotification);


// Create an HTTP server from the Express app
const server = http.createServer(app);

// start Socket
setupWebSocketServer(server);



// Start the server
server.listen(PORT, async () => {
    await fetchSatelliteData();
    console.log(`Server running on port ${PORT}`);
});


const startServer = async () => {
    await connectDB();
    await fetchSatelliteData();
};

startServer();