import { useNavigate } from "react-router-dom";

const SatelliteGroupSelector = ({ setSelectedGroup, selectedGroup, showSimulateButton, satPositions }) => {
    const navigate = useNavigate()
    const satelliteGroups = [
        { name: 'Intelsat', value: 'intelsat' },
        { name: 'Iridium', value: 'iridium' },
        { name: 'Starlink', value: 'starlink' },
        { name: 'Other-Comm', value: 'other-comm' }
    ];

    const handleCheckboxChange = (event) => {
        setSelectedGroup(event.target.value);
    };

    const handleSimulate = () => {
        console.log('Simulating...');
        navigate('/satellites/drift');
    };

    return (
        <div className="group">
            <h2>Select Satellite Group</h2>
            <div className="checkbox-group">
                {satelliteGroups.map((group) => (
                    <div key={group.value}>
                        <input
                            type="radio"
                            name="group"
                            value={group.value}
                            checked={selectedGroup === group.value}
                            onChange={handleCheckboxChange}
                        />
                        {group.name}
                    </div>
                ))}
            </div>
            {showSimulateButton && (
                <div>
                    <button onClick={handleSimulate}>Simulate Drift</button>
                </div>
            )}
        </div>
    );
};

export default SatelliteGroupSelector;