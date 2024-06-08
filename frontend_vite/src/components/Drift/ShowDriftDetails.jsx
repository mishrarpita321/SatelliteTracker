const ShowDrfitDetails = () => {
const data = [
    {meanMotion: 0.067, eccentricity: 0.0001, inclination: 0.0001},
    {meanMotionThres: 0.067, eccentricityThres: 0.0001, inclinationThres: 0.0001},
]

    return (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
                <tr>
                    <th></th>
                    <th style={{ padding: '8px', backgroundColor: 'lightgray', color: 'black' }}>Mean motion</th>
                    <th style={{ border: '1px solid black', padding: '8px', backgroundColor: 'lightgray', color: 'black' }}>Eccentricity</th>
                    <th style={{ border: '1px solid black', padding: '8px', backgroundColor: 'lightgray', color: 'black' }}>Inclination</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={{ border: '1px solid black', backgroundColor: 'lightgray', color: 'black' }}>Real data</td>
                    <td style={{ border: '1px solid white', padding: '8px' }}>Row 1, Cell 1</td>
                    <td style={{ border: '1px solid white', padding: '8px' }}>Row 1, Cell 2</td>
                    <td style={{ border: '1px solid white', padding: '8px' }}>Row 1, Cell 3</td>
                </tr>
                <tr>
                    <td style={{ border: '1px solid black', backgroundColor: 'lightgray', color: 'black' }}>Threshold</td>
                    <td style={{ border: '1px solid white', padding: '8px' }}>0.05</td>
                    <td style={{ border: '1px solid white', padding: '8px' }}>0.0001</td>
                    <td style={{ border: '1px solid white', padding: '8px' }}>0.01</td>
                </tr>
            </tbody>
        </table>
    )
};

export default ShowDrfitDetails;