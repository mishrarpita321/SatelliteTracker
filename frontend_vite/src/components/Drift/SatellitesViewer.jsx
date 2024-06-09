import CesiumContainer from "./CesiumContainer";
import SatelliteGroupSelector from "./SatelliteGroupSelector";
import { useState } from "react";

const SatellitesViewer = ({setSelectedSatelliteName}) => {
    const [selectedGroup, setSelectedGroup] = useState('');
    const [showSimulateButton, setShowSimulateButton] = useState(false);
    const [satPositions, setSatPositions] = useState([]);

    return (
        <>
            <h1>Satellites Visualisation</h1>
            <div className="row">
                <div className="col-md-9">
                    <CesiumContainer selectedGroup={selectedGroup} setShowSimulateButton={setShowSimulateButton} setSelectedSatelliteName={setSelectedSatelliteName} setSatPositions={setSatPositions} satPositions={satPositions} />
                </div>
                <div className="col-md-3">
                    <SatelliteGroupSelector setSelectedGroup={setSelectedGroup} selectedGroup={selectedGroup} showSimulateButton={showSimulateButton} satPositions={satPositions} />
                </div>
            </div>
        </>
    );
};

export default SatellitesViewer;