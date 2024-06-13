const WebSocket = require('ws');
const { subscribeToSatelliteGroups, unsubscribeToSatelliteGroups } = require('./driftSatellitesMiddleware');
const { subscribeToAsteroid, unsubscribeFromAsteroid, handleIntervalChange } = require('./asteroidMiddleware');

let connections = new Set();

const AsteroidSubscribers = new Map();
const satelliteGroupSubscribers = new Map();
const updateIntervals = new Map();

function setupWebSocketServer(server) {
    console.log('Setting up WebSocket server..');
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, ws => {
            wss.emit('connection', ws, req);
            connections.add(ws); 
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
            console.log('WebSocket connection closedTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT');
            connections.delete(ws); 

            AsteroidSubscribers.forEach((asteroidSubs, asteroidId) => {
                asteroidSubs.forEach((intervalSubs, simulatedInterval) => {
                    intervalSubs.delete(ws);
                    if (intervalSubs.size === 0) {
                        asteroidSubs.delete(simulatedInterval);
                        if (asteroidSubs.size === 0) {
                            clearInterval(updateIntervals.get(asteroidId));
                            updateIntervals.delete(asteroidId);
                            AsteroidSubscribers.delete(asteroidId);
                        }
                    }
                });
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
            subscribeToAsteroid(ws, updateIntervals, AsteroidSubscribers, data);
            break;
        case 'changeInterval':
            handleIntervalChange(ws, updateIntervals, AsteroidSubscribers, data);
            break;
        case 'stopAsteroidTracking':
            unsubscribeFromAsteroid(ws, updateIntervals, AsteroidSubscribers, data);
            break;
        case 'requestSatelliteGroupPosition':
            subscribeToSatelliteGroups(ws, updateIntervals, satelliteGroupSubscribers, data.group);
            console.log('Satellite group start:', data.group);
            break;
        case 'stopSatelliteGroupTracking':
            unsubscribeToSatelliteGroups(ws, updateIntervals, satelliteGroupSubscribers, data.group);
            console.log('Satellite group stop:', data.group);
            break;
        default:
            console.error('Unknown type or command from WebSocket client:', data.type);
    }
}
module.exports = { setupWebSocketServer, connections }; 
