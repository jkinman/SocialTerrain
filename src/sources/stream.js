import openSocket from "socket.io-client";
// const socket = openSocket("http://localhost:3000");
import config from 'config';
const socket = openSocket(config.serverUrl);

class socialStore {

  constructor(newTweet){
    // this.newTweet = newTweet;
  }

  subscribeToTwitter(tweetAction) {
    this.tweetAction = tweetAction;
    socket.on("twitter", tweet => tweetAction(tweet));
  }

}

export default socialStore;
