import { Viewer, Entity, BillboardGraphics } from "resium";
import { Cartesian3, Color } from 'cesium';

const DriftCesium = () => {
    const position1 = Cartesian3.fromDegrees(-74.0707383, 40.7117244, 100);
    const position2 = Cartesian3.fromDegrees(-40.0707383, 40.7117244, 100);
    const pointGraphics = { pixelSize: 10, color: Color.RED };

    return (
        <Viewer
            timeline={false}
            animation={false}
            geocoder={false}
            homeButton={false}
            // infoBox={false}
            projectionPicker={false}
            fullscreenButton={false}
            vrButton={false}
            navigationHelpButton={false}
            navigationInstructionsInitiallyVisible={false}
            shouldAnimate={true}>
            <Entity
                name="Satellite"
                position={position1}
                description="Satellite"
                point={pointGraphics}
            >
            </Entity>
            <Entity
                name="Satellite"
                position={position2}
                description="Satellite"
                point={pointGraphics}
            >
                <BillboardGraphics
                    image="/assets/satellite.png"
                    scale={0.1} />
            </Entity>
        </Viewer>
    );
}

export default DriftCesium;