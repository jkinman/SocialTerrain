import React from "react";
import "./scene.scss";
import Landscape from './3d/NoiseGroundTreadmill/NoiseGroundTreadmill';
// import Landscape from "./3d/ProceduralLandscape";


class Scene extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { tweets, socket } = this.props;
    return (
      <div className="">
        <Landscape
          ref="3dScene"
          terrainColour={"white"}
          meshTerrain={true}
          fog={true}
          tweets={tweets}
          socket={socket}
        />
      </div>
    );
  }
}

Scene.displayName = "Scene";
Scene.propTypes = {};
Scene.defaultProps = {};

export default Scene;
