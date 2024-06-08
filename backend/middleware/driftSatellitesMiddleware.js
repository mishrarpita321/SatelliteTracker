const { WebSocket } = require("ws");
const { calculateSatellitePositions } = require("../controllers/driftSatellitePositions");

function subscribeToSatelliteGroups(ws, updateIntervals, satelliteGroupSubscribers, group) {
    // console.log('Subscribing to sat groups:', group);
    if (!satelliteGroupSubscribers.has(group)) {
        // console.log("satelliteGroupSubscribers has group",satelliteGroupSubscribers);
        satelliteGroupSubscribers.set(group, new Set());
        // console.log("satelliteGroupSubscribers has group",satelliteGroupSubscribers);
    }

    const subs = satelliteGroupSubscribers.get(group);
    subs.add(ws);
    // console.log("subs",subs);
    // console.log("updateIntervals",updateIntervals);

    if (!updateIntervals.has(group)) {
        // console.log("inside updateIntervals");
        const intervalId = setInterval(async () => {
            console.log("insde intervalId", group);

            const position = await calculateSatellitePositions(group);
            const message = JSON.stringify({
                type: 'groupPosition',
                group: group,
                position
            });
            subs.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }, 1000); // Consider making this configurable
        updateIntervals.set(group, intervalId);
        // console.log("intervalId", intervalId);
    }
}

function unsubscribeToSatelliteGroups(ws, updateIntervals, satelliteGroupSubscribers, group) {
    if (satelliteGroupSubscribers.has(group)) {
        const subs = satelliteGroupSubscribers.get(group);
        subs.delete(ws);
        if (subs.size === 0) {
            clearInterval(updateIntervals.get(group));
            updateIntervals.delete(group);
            satelliteGroupSubscribers.delete(group);
            console.log(`Stopped tracking sat groups ${group} due to no subscribers.`);
        }
    }
}

module.exports = { subscribeToSatelliteGroups, unsubscribeToSatelliteGroups };