require('dotenv').config();
const express = require('express');
const http = require('http');
const { connectDB } = require('./config/db');
const driftRoutes = require('./routes/driftRoutes');
const app = express();
const cors = require('cors');
const { fetchSatelliteData, calculateSatellitePositions } = require('./controllers/driftSatellitePositions');
const { setupWebSocketServer } = require('./middleware/webSocketMiddleware');
const { sendTestNotification } = require('./controllers/notificationController');
const { fetchAndStoreSatelliteData } = require('./controllers/driftController');
app.use(cors());
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());
app.use('/api/drift', driftRoutes);
app.use(express.static('public'));
app.post('/api/sendNotification', sendTestNotification);

// Create an HTTP server from the Express app
const server = http.createServer(app);
// const wss = new WebSocket.Server({ port: 3002 });

// Start the server
server.listen(PORT, async () => {
    await fetchSatelliteData();
    console.log(`Server running on port ${PORT}`);
});

setupWebSocketServer(server);

const startServer = async () => {
    await connectDB();
    await fetchSatelliteData();
    // setInterval(fetchAndStoreSatelliteData, 12 * 60 * 60 * 1000);
    // setInterval(fetchSatelliteData, 60 * 60 * 1000);
};

startServer();
