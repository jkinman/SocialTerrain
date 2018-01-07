import React from 'react';
import YeomanImage from './YeomanImage';
import './app.scss';
import Scene from './Scene';

class AppComponent extends React.Component {

  render() {
    return (
      <div>
        <Scene />
      </div>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
