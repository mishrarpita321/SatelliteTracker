import SatelliteForm from "./SatelliteForm";

const ShowDrfitDetails = ({ satPositions }) => {
    const { latitude, longitude, altitude } = satPositions;

    return (
        <>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
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
            <div style={{marginTop: '5%'}}>
                <h3>Position Details</h3>
                <p>Longitude: {longitude}</p>
                <p>Latitude: {latitude}</p>
                <p>Altitude: {altitude}</p>
            </div>
        </>
    );
};

export default ShowDrfitDetails;