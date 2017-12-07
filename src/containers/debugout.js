import React, {
  Component,
  PropTypes
} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {newTweet} from '../actions/';
import subscribeToTwitter from '../sources/stream';

class debugout extends Component {
  constructor(p,c){
    super(p,c);
    subscribeToTwitter(
      (tweet) => {
        dispatch(newTweet(tweet));
      }
    )
  }

  render() {
    const { actions } = this.props;
    return (
    <div actions={actions}>
    
    </div>);
  }
}

debugout.propTypes = {
  actions: PropTypes.shape({})
};

function mapStateToProps(state) {
  const props = {};
  return props;
}

function mapDispatchToProps(dispatch) {
  const actions = {};
  const actionMap = { actions: bindActionCreators(actions, dispatch) };
  return actionMap;
}

export default connect(mapStateToProps, mapDispatchToProps)(debugout);
