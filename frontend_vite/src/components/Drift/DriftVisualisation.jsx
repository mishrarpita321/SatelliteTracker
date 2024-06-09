import DriftCesium from "./DriftCesium";
import SatelliteForm from "./SatelliteForm";
import ShowDrfitDetails from "./ShowDriftDetails";
import { useState } from "react";

const DriftVisualisation = ({ satName }) => {
    const [satPositions, setSatPositions] = useState([]);
console.log('satPositions:', satPositions);
    return (
        <div>
            <h1>Drift Visualisation</h1>
            <div className="row">
                <div className="col-md-7">
                    <DriftCesium satName={satName} setSatPositions={setSatPositions} satPositions={satPositions} />
                </div>
                <div className="col-md-5">
                    <ShowDrfitDetails satName={satName} satPositions={satPositions} />
                    <SatelliteForm satPositions={satPositions} />
                </div>
            </div>
        </div>
    );
}

export default DriftVisualisation;