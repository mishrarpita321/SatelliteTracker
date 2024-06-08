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

};

startServer();

// wss.on('connection', (ws) => {
//     console.log('Client connected..');
//     let interval;

//     ws.on('message', async (message) => {
//         try {
//             // Parse the message
//             const { group } = JSON.parse(message);

//             // Define a function to send satellite positions
//             const sendSatellitePositions = async () => {
//                 const satellitePositions = await calculateSatellitePositions(group);
//                 ws.send(JSON.stringify({ satellitePositions }));
//             };

//             // Clear the previous interval
//             if (interval) {
//                 clearInterval(interval);
//             }

//             // Send positions immediately
//             await sendSatellitePositions();

//             // Set up interval to send positions periodically
//             interval = setInterval(async () => {
//                 await sendSatellitePositions();
//             }, 1000);

//             // Clear interval on client disconnect
//             ws.on('close', () => {
//                 clearInterval(interval);
//             });

//             // Handle any potential errors
//             ws.on('error', (error) => {
//                 console.error('WebSocket error:', error);
//                 clearInterval(interval);
//             });
//         } catch (error) {
//             console.error('Error processing message:', error);
//             ws.send(JSON.stringify({ error: 'Invalid message format' }));
//         }
//     });
// });

