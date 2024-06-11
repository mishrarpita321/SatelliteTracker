import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ visibilityPolygon }) => {
    const [polygon, setPolygon] = useState([]);

    useEffect(() => {
        if (visibilityPolygon) {
            setPolygon(visibilityPolygon.geometry.coordinates[0].map(coord => [coord[1], coord[0]]));
        }
    }, [visibilityPolygon]);

    return (
        <MapContainer center={[51.505, -0.09]} zoom={2} style={{ height: '100vh', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {polygon.length > 0 && (
                <Polygon positions={polygon} />
            )}
        </MapContainer>
    );
};

export default MapComponent;
