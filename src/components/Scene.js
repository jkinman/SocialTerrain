import React from "react";
import "./scene.scss";
import Landscape from './3d/NoiseGroundTreadmill/NoiseGroundTreadmill';
// import Landscape from "./3d/ProceduralLandscape";


class Scene extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { tweets } = this.props;
    return (
      <div className="">
        <Landscape
          ref="3dScene"
          terrainColour={"white"}
          meshTerrain={true}
          tweets={tweets}
        />
      </div>
    );
  }
}

Scene.displayName = "Scene";
Scene.propTypes = {};
Scene.defaultProps = {};

export default Scene;
