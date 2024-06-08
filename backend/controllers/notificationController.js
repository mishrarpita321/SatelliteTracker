const { broadcastMessage } = require("../helper/socketHelper");

exports.sendTestNotification = (req, res) => {
    const { message } = req.body;
    console.log(message);
    broadcastMessage(message);

    res.status(200).json({ 'message': 'Notification sent to all connected users.' });
};