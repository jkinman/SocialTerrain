import React, { Component, PropTypes } from "react";
//   import { connect } from 'react-redux';
//   import { bindActionCreators } from 'redux';
import config from "config";
import ProceduralScene from "../components/Scene";
import TwitterStream from "../sources/stream";

class sceneContainer extends Component {
  componentDidMount() {
    this.twitterStream = new TwitterStream(this.props.actions.newTweet);
    this.twitterStream.subscribeToTwitter(this.props.actions.newTweet);
  }

  render() {
    return <ProceduralScene />;
  }
}

//   Debugout.propTypes = {
//     actions: PropTypes.shape({})
//   };

//   function mapStateToProps(state) {
//     const props = {
//       tweets: state.social.tweets
//     };
//     return props;
//   }

//   function mapDispatchToProps(dispatch) {
//     const actions = {newTweet};
//     const actionMap = { actions: bindActionCreators(actions, dispatch) };
//     return actionMap;
//   }

export default sceneContainer;
//   export default connect(mapStateToProps, mapDispatchToProps)(sceneContainer);
