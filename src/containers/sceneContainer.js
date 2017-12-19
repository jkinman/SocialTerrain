import React, { Component, PropTypes } from "react";
//   import { connect } from 'react-redux';
//   import { bindActionCreators } from 'redux';
import config from "config";
import ProceduralScene from "../components/Scene";
import TwitterStream from "../sources/stream";

class sceneContainer extends Component {
  componentDidMount() {
    this.twitterStream = new TwitterStream();
    this.twitterStream.subscribeToTwitter(this.props.actions.newTweet);
  }

  render() {
    const { actions, tweets } = this.props;
    return <ProceduralScene tweets={tweets} actions={actions}/>;
  }
}

sceneContainer.propTypes = {
  actions: PropTypes.shape({})
};

export default sceneContainer;

