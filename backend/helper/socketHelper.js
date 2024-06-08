const WebSocket = require('ws');  // Import WebSocket from the 'ws' package
const { connections } = require('../middleware/webSocketMiddleware');

function broadcastMessage(message) {
    connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'notification',
                message: message
            }));
        }
    });
}

module.exports = { broadcastMessage };
