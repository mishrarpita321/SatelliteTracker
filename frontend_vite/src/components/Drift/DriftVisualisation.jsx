import DriftCesium from "./DriftCesium";
import SatelliteForm from "./SatelliteForm";
import ShowDrfitDetails from "./ShowDriftDetails";
import { useState } from "react";

const DriftVisualisation = ({ satName }) => {
    return (
        <div>
            {/* <div className="row"> */}
                {/* <div className="col-md-7">
                    <DriftCesium satName={satName} setSatPositions={setSatPositions} satPositions={satPositions} />
                </div>
                <div className="col-md-5">
                    <ShowDrfitDetails satName={satName} satPositions={satPositions} />
                    <SatelliteForm satPositions={satPositions} />
                </div> */}
                <DriftCesium satName={satName} setSatPositions={setSatPositions} satPositions={satPositions} />
                <ShowDrfitDetails satName={satName} satPositions={satPositions} setSatPositions={setSatPositions}/>
                <SatelliteForm satPositions={satPositions} />
            {/* </div> */}
        </div>
    );
}

export default DriftVisualisation;