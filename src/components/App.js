import React from 'react';
import YeomanImage from './YeomanImage';
import './app.css';
import Scene from './Scene';

class AppComponent extends React.Component {

  render() {
    return (
        <Scene />
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
