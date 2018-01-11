import React, { Component, PropTypes } from "react";
//   import { connect } from 'react-redux';
//   import { bindActionCreators } from 'redux';
import config from "config";
import ProceduralScene from "../components/Scene";
import TwitterStream from "../sources/stream";
import HUD from '../components/HUD/HUD'

class sceneContainer extends Component {
  componentDidMount() {
    this.twitterStream = new TwitterStream();
    this.twitterStream.subscribeToTwitter(this.props.actions.newTweet);
  }

  render() {
    const { actions, tweets } = this.props;
    return (
      <div>
        <HUD tweets={tweets} />
        <ProceduralScene tweets={tweets} actions={actions}/>
      </div>
  );
  }
}

sceneContainer.propTypes = {
  actions: PropTypes.shape({})
};

export default sceneContainer;

