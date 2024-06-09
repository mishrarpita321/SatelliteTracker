const { WebSocket } = require("ws");
const { getFakeAsteroidOrbitalPosition, getAsteroidOrbitalPosition, getOtbitalDatabyId } = require("../utils/predictAsteroidPosition");
function subscribeToAsteroid(ws, updateIntervals, AsteroidSubscribers, asteroidId) {
    console.log('Subscribing to asteroid:', asteroidId);
    if (!AsteroidSubscribers.has(asteroidId)) {
        AsteroidSubscribers.set(asteroidId, new Set());
    }
    console.log('AsteroidSubscribers:', AsteroidSubscribers);
    const subs = AsteroidSubscribers.get(asteroidId);
    subs.add(ws);
    console.log('Subs:', subs);
    console.log('updateIntervals:', updateIntervals)

    if (!updateIntervals.has(asteroidId)) {
        getOtbitalDatabyId(asteroidId)
            .then(orbitalData => {
                console.log('Orbital data:', orbitalData);
                const intervalId = setInterval(async () => {
                    console.log('Updating asteroid position:', asteroidId);

                    const position = await getAsteroidOrbitalPosition(orbitalData, new Date());
                    const message = JSON.stringify({
                        type: 'asteroidPosition',
                        id: asteroidId,
                        orbitalData: orbitalData,
                        position
                    });
                    subs.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(message);
                        }
                    });
                }, 1000); // Consider making this configurable
                updateIntervals.set(asteroidId, intervalId);
            })
            .catch(error => {
                console.error('Error getting orbital data:', error);
            });
    }
}

function unsubscribeFromAsteroid(ws, updateIntervals, AsteroidSubscribers, group) {
    if (AsteroidSubscribers.has(asteroidId)) {
        const subs = AsteroidSubscribers.get(asteroidId);
        subs.delete(ws);
        if (subs.size === 0) {
            clearInterval(updateIntervals.get(asteroidId));
            updateIntervals.delete(asteroidId);
            AsteroidSubscribers.delete(asteroidId);
            console.log(`Stopped tracking asteroid ${asteroidId} due to no AsteroidSubscribers.`);
        }
    }
}


module.exports = { subscribeToAsteroid, unsubscribeFromAsteroid };