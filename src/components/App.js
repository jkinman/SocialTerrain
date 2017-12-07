import React from 'react';
import YeomanImage from './YeomanImage';
import './app.css';
import Scene from './Scene';
import {subscribeToTwitter} from '../sources/stream';
import debugout from '../containers/debugout';

class AppComponent extends React.Component {

  constructor(props, context) {
    super(props,context);
    subscribeToTwitter(tweet => console.log(tweet));
  }

  render() {
    return (
      <div>
        <debugout />
        <Scene />
      </div>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
