import openSocket from "socket.io-client";
// const socket = openSocket("http://localhost:3000");
import config from 'config';
const socket = openSocket(`${config.serverUrl}/client`);

class socialStore {

  constructor(newTweet){
    // this.newTweet = newTweet;
  }

  subscribeToTwitter(tweetAction) {
    this.tweetAction = tweetAction;
    socket.on("twitter", (tweet) => {
      let parsedData = JSON.parse(tweet)
      if( Array.isArray( parsedData )){
        parsedData.map((obj) => tweetAction(obj))
      }
      else{
        tweetAction(parsedData);
      }
    })
  }
  
  get socket() {
    return socket;
  }
}

export default socialStore;
