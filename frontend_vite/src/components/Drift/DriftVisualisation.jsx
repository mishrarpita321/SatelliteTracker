import { Viewer, Entity, BillboardGraphics } from "resium";
import { Cartesian3, Color } from 'cesium';
import DriftCesium from "./DriftCesium";
import ShowDrfitDetails from "./ShowDriftDetails";

const DriftVisualisation = ({ satName }) => {
    return (
        <div>
            <h1>Drift Visualisation</h1>
            <div className="row">
                <div className="col-md-7">
                    <DriftCesium />
                </div>
                <div className="col-md-5">
                    <ShowDrfitDetails />
                    <button>Make Drift</button>
                </div>
            </div>
        </div>
    );
}

export default DriftVisualisation;