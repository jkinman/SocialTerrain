import React from 'react';
import YeomanImage from './YeomanImage';
import './app.scss';
import Scene from './Scene';

class AppComponent extends React.Component {

  render() {
    return (
      <div>
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
