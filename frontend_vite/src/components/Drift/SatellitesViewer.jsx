import CesiumContainer from "./CesiumContainer";
import DriftVisualisation from "./DriftVisualisation";
import SatelliteGroupSelector from "./SatelliteGroupSelector";
import { useState } from "react";
import ShowDrfitDetails from "./ShowDriftDetails";
import SatelliteForm from "./SatelliteForm";
import PositionDetails from "./PositionDetails";

const SatellitesViewer = ({ setSelectedSatelliteName, satName }) => {
    const [selectedGroup, setSelectedGroup] = useState('');
    const [showSimulateButton, setShowSimulateButton] = useState(false);
    const [satPositions, setSatPositions] = useState([]);
    const [showDriftVisualisation, setShowDriftVisualisation] = useState(false);
    const [selectedSatPositions, setSelectedSatPositions] = useState([]);

    return (
        <>
            <h1>Satellites Visualisation</h1>
            <div className="row">
                <div className="col-md-8">
                    <CesiumContainer selectedGroup={selectedGroup} setShowSimulateButton={setShowSimulateButton} setSelectedSatelliteName={setSelectedSatelliteName} setSatPositions={setSatPositions} satPositions={satPositions} />
                </div>
                <div className="col-md-4">
                    <SatelliteGroupSelector setSelectedGroup={setSelectedGroup} selectedGroup={selectedGroup} showSimulateButton={showSimulateButton} setShowDriftVisualisation={setShowDriftVisualisation} />
                    {showDriftVisualisation && <PositionDetails position={selectedSatPositions} />}
                </div>
            </div>
            {showDriftVisualisation &&
                <div className="row">
                    <div className="col-md-8">
                        <ShowDrfitDetails satName={satName} satPositions={selectedSatPositions} setSatPositions={setSelectedSatPositions} />
                    </div>
                    <div className="col-md-4">
                        <SatelliteForm satPositions={selectedSatPositions} />
                    </div>
                </div>
            }
        </>
    );
};

export default SatellitesViewer;