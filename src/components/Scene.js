import React from 'react';
import './scene.scss';
import Landscape from './3d/ProceduralLandscape';

class Scene extends React.Component {

    constructor(props) {
      super(props);
      
    }

  render() {
    return (
      <div className="">
        <Landscape ref="3dScene"  terrainColour={"#33ff33"} meshTerrain={true}/>
      </div>
    );
  }
}

Scene.displayName = 'Scene';
Scene.propTypes = {};
Scene.defaultProps = {};

export default Scene;
