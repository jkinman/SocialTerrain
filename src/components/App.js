import React from 'react';
import YeomanImage from './YeomanImage';
import './app.css';
import Scene from './Scene';
// import {subscribeToTwitter} from '../sources/stream';
import Debugout from '../containers/debugout';

class AppComponent extends React.Component {

  render() {
    return (
      <div>
        <Debugout/>
        <Scene />
        <ul>
        {this.props.social.tweets.map((item, i) => (
        <li key={i}>{item.text}</li>
        ))}
        </ul>
      </div>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
