import { Viewer, Entity, BillboardGraphics, PathGraphics } from 'resium';
import { Cartesian3, Color, IonImageryProvider, Ion } from 'cesium';
import { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';

import satelliteImage from '../../assets/satellite.png'; // Import the satellite image

const CesiumContainer = ({ selectedGroup, setShowSimulateButton, setSelectedSatelliteName, setSatPositions, satPositions }) => {
    const { sendMessage, addMessageHandler } = useWebSocket();
    
    const wsRef = useRef(null);

    Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NmY2ZjJmMi05YzdjLTQ3NTYtODA5Ny1jMWNkZmEzMDdlOGMiLCJpZCI6MjE3ODkwLCJpYXQiOjE3MTY3NDU2NzR9.V1EEHxWIIdUiDzPRn1QdVpH_QmwhmhiDSovbCnrbAU4';
    const ionBing = new IonImageryProvider({ assetId: 3 });

    const groupColors = {
        intelsat: Color.YELLOW,
        iridium: Color.DARKGOLDENROD,
        starlink: Color.RED,
    };

    const color = groupColors[selectedGroup] || Color.ORANGE;

    const pointGraphics = {
        pixelSize: 12,
        color: color,
    };

    useEffect(() => {
        const handleSatelliteGroupMsg = (data) => {
            if (data.type === 'groupPosition' && data.group === selectedGroup) {
                setSatPositions(data.position);
            }
        };

        addMessageHandler(handleSatelliteGroupMsg);
        if(selectedGroup!==null){
            sendMessage({
                type: 'requestSatelliteGroupPosition',
                group: selectedGroup
            }).catch(err => {
                // setError('Failed to send message to WebSocket.');
                console.error('WebSocket send error:', err);
            });
        }


        return () => {
            sendMessage({
                type: 'stopSatelliteGroupTracking',
                group: selectedGroup
            }).catch(err => console.error('Failed to send stop message', err));
        };
    }, [selectedGroup]);

    const handleClick = (satname) => () => {
        setShowSimulateButton(true);
        setSelectedSatelliteName(satname);
    };

    return (
        <Viewer
            timeline={false}
            animation={false}
            geocoder={false}
            homeButton={false}
            // infoBox={false}
            projectionPicker={false}
            fullscreenButton={false}
            vrButton={false}
            navigationHelpButton={false}
            navigationInstructionsInitiallyVisible={false}
            shouldAnimate={true}
            imageryProvider={ionBing}
        >
            {satPositions && satPositions.map((sat) => (
                <Entity
                    key={sat.noradCatId}
                    id={sat.noradCatId}
                    position={Cartesian3.fromDegrees(sat.longitude, sat.latitude, sat.altitude)}
                    // billboard={{
                    //     image: satelliteImage,
                    //     scale: 0.1,
                    //     // color: color,
                    // }}
                    point={pointGraphics}
                    description={`
                        <div>${sat.satname} - ${sat.orbittype}</div>
                        <p>Position:</p>
                        <div>Longitude: ${sat.longitude}</div>
                        <div>Latitude: ${sat.latitude}</div>
                        <div>Altitude: ${sat.altitude}</div>
                    `}
                    onClick={handleClick(sat.satname)}
                >
                </Entity>
            ))}
        </Viewer>
    )
};

export default CesiumContainer;