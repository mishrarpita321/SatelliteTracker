const PositionDetails = ({ position }) => {
    const { longitude, latitude, altitude } = position;

    return (
        <div style={{ marginTop: '5%' }}>
            <h3>Position Details</h3>
            <p>Longitude: {longitude}</p>
            <p>Latitude: {latitude}</p>
            <p>Altitude: {altitude}</p>
        </div>
    );
};

export default PositionDetails;