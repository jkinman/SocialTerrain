import React from "react";
import config from "config";
import openSocket from "socket.io-client";
import "./HUD.scss";

const socket = openSocket(config.serverUrl);

class HUD extends React.Component {
    constructor(p,c){
        super(p,c);
        this.state = {messages: []};
    }

    componentDidMount() {
        socket.on('chat message', message => {
            this.setState( {messages:[...this.state.messages, message]} );
            setTimeout( () => this.setState({messages:[]}), 3000 );
        });
    }
  render() {
    // const { tweets } = this.props;
    return (
      <div className="HUD-component">
        <h1>{this.state.messages[0]}</h1>
      </div>
    );
  }
}

HUD.displayName = "HUD";
HUD.propTypes = {};
HUD.defaultProps = {};

export default HUD;
