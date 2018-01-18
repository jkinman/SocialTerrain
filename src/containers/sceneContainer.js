import React, { Component, PropTypes } from "react";
import config from "config";
import ProceduralScene from '../components/3d/NoiseGroundTreadmill/NoiseGroundTreadmill';
import TwitterStream from "../sources/stream";
import HUD from '../components/HUD/HUD'

class sceneContainer extends Component {
  constructor( props, context) {
    super(props, context);
    this.twitterStream = new TwitterStream();
    this.twitterStream.subscribeToTwitter(this.props.actions.newTweet);

  }
  componentDidMount() {

  }

  render() {
    const { actions, tweets } = this.props;
    return (
      <div>
        <HUD tweets={tweets} />
        <ProceduralScene 
        tweets={tweets} 
        actions={actions} 
        ref="3dScene"
        terrainColour={"white"}
        meshTerrain={true}
        fog={true}
        socket={this.twitterStream.socket} 
        />
      </div>
  );
  }
}

sceneContainer.propTypes = {
  actions: PropTypes.shape({})
};

export default sceneContainer;

