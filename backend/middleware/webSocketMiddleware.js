const WebSocket = require('ws');
const { subscribeToSatelliteGroups, unsubscribeToSatelliteGroups } = require('./driftSatellitesMiddleware');
// const { getFakeAsteroidOrbitalPosition } = require('../utils/predictPosition');

// Store all active connections for broad messaging
let connections = new Set();

// Maps to manage subscribers and intervals for specific asteroid updates
const subscribers = new Map();
const satelliteGroupSubscribers = new Map();
const updateIntervals = new Map();

function setupWebSocketServer(server) {
    console.log('Setting up WebSocket server..');
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, ws => {
            wss.emit('connection', ws, req);
            connections.add(ws); // Add to global connections set for notifications
        });
    });

    wss.on('connection', ws => {
        console.log('WebSocket connection established');

        ws.on('message', message => {
            console.log('Received message:', message);
            try {
                const data = JSON.parse(message);
                handleClientMessage(ws, data);
            } catch (error) {
                console.error('Failed to parse message:', message, 'Error:', error);
            }
        });


        ws.on('close', () => {
            console.log('WebSocket connection closed');
            connections.delete(ws); // Remove from global set on close
            // Clean up any subscriptions this connection had
            subscribers.forEach((subs, asteroidId) => {
                subs.delete(ws);
                if (subs.size === 0) {
                    clearInterval(updateIntervals.get(asteroidId));
                    updateIntervals.delete(asteroidId);
                    subscribers.delete(asteroidId);
                }
            });
            satelliteGroupSubscribers.forEach((subs, group) => {
                subs.delete(ws);
                if (subs.size === 0) {
                    clearInterval(updateIntervals.get(group));
                    updateIntervals.delete(group);
                    satelliteGroupSubscribers.delete(group);
                }
            });
        });
    });
}

function handleClientMessage(ws, data) {
    console.log('Handling message:', data);
    switch (data.type) {
        case 'requestAsteroidPosition':
            // subscribeToAsteroid(ws, data.asteroidId);
            break;
        case 'stopAsteroidTracking':
            // unsubscribeFromAsteroid(ws, data.asteroidId);
            break;
        case 'requestSatelliteGroupPosition':
            subscribeToSatelliteGroups(ws,updateIntervals, satelliteGroupSubscribers , data.group);
            console.log('Satellite group start:', data.group);
            break;
        case 'stopSatelliteGroupTracking':
            unsubscribeToSatelliteGroups(ws,updateIntervals, satelliteGroupSubscribers , data.group);
            console.log('Satellite group stop:', data.group);
            break;
        default:
            console.error('Unknown type or command from WebSocket client:', data.type);
    }
}
module.exports = { setupWebSocketServer, connections }; // Export connections for external use
