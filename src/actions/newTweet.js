import { NEW_TWEET } from './const';

function newTweet(tweet) {
  return { type: NEW_TWEET, payload: tweet };
}

module.exports = newTweet;
