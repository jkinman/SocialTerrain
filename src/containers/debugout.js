import React, {
  Component,
  PropTypes
} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {newTweet} from '../actions/';
import openSocket from 'socket.io-client';
import config from 'config';

const socket = openSocket(config.serverUrl);

class Debugout extends Component {

  constructor(p,c) {
    super(p,c);

    const {tweets} = this.props;
    const {newTweet} = this.props.actions;
    socket.on('twitter', (tweet) => {
      newTweet(JSON.parse(tweet));
    });
  }

  render() {
    return (
    <div >
    </div>);
  }
}

Debugout.propTypes = {
  actions: PropTypes.shape({})
};

function mapStateToProps(state) {
  const props = {
    tweets: state.social.tweets
  };
  return props;
}

function mapDispatchToProps(dispatch) {
  const actions = {newTweet};
  const actionMap = { actions: bindActionCreators(actions, dispatch) };
  return actionMap;
}

export default connect(mapStateToProps, mapDispatchToProps)(Debugout);
