import React from "react";
import "./scene.scss";
import Landscape from "./3d/ProceduralLandscape";
// import config from 'config';
// import openSocket from 'socket.io-client';

// const socket = openSocket(config.serverUrl);
// socket.on('orientation', (orientation) => {
//   this.orientation = orientation;
// });

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
          terrainColour={"#ffffff"}
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
