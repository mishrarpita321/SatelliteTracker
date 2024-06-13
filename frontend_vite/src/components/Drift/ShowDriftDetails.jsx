import { useEffect, useState } from "react";
import { useWebSocket } from '../../context/WebSocketContext';


const ShowDrfitDetails = ({ satPositions, setSatPositions, satName }) => {
    // const { latitude, longitude, altitude } = satPositions;
    const { sendMessage, addMessageHandler } = useWebSocket();

    useEffect(() => {
        const handleSatelliteGroupMsg = (data) => {
            if (data.type === 'selectedSatPosition' && data.satName === satName) {
                setSatPositions(data.position);
            }
        };

        addMessageHandler(handleSatelliteGroupMsg);
        if (satName !== null) {
            sendMessage({
                type: 'requestSelectedSatellitePosition',
                satName: satName
            }).catch(err => {
                // setError('Failed to send message to WebSocket.');
                console.error('WebSocket send error:', err);
            });
        }


        return () => {
            sendMessage({
                type: 'stopSelectedSatellitePosition',
                satName: satName
            }).catch(err => console.error('Failed to send stop message', err));
        };
    }, [satName, satPositions]);

    return (
        <>
            <table style={{ borderCollapse: 'collapse', width: '100%' , marginLeft: '20px',marginTop: '25px'}}>
                <thead>
                    <tr>
                        <th style={{ padding: '8px', backgroundColor: 'lightgray', color: 'black' }}>{satPositions.objectName}</th>
                        <th style={{ padding: '8px', backgroundColor: 'lightgray', color: 'black' }}>Mean motion (Revs per day)</th>
                        <th style={{ border: '1px solid black', padding: '8px', backgroundColor: 'lightgray', color: 'black' }}>Eccentricity</th>
                        <th style={{ border: '1px solid black', padding: '8px', backgroundColor: 'lightgray', color: 'black' }}>Inclination (Degrees)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ border: '1px solid black', backgroundColor: 'lightgray', color: 'black' }}>Real data</td>
                        <td style={{ border: '1px solid white', padding: '8px' }}>{satPositions.meanMotion}</td>
                        <td style={{ border: '1px solid white', padding: '8px' }}>{satPositions.eccentricity}</td>
                        <td style={{ border: '1px solid white', padding: '8px' }}>{satPositions.inclination}</td>
                    </tr>
                    <tr>
                        <td style={{ border: '1px solid black', backgroundColor: 'lightgray', color: 'black' }}>Threshold</td>
                        <td style={{ border: '1px solid white', padding: '8px' }}>0.05</td>
                        <td style={{ border: '1px solid white', padding: '8px' }}>0.001</td>
                        <td style={{ border: '1px solid white', padding: '8px' }}>0.01</td>
                    </tr>
                </tbody>
            </table>
        </>
    );
};

export default ShowDrfitDetails;