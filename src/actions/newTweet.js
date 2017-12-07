import { NEW_TWEET } from './const';

function action(tweet) {
  return { type: NEW_TWEET, tweet };
}

module.exports = action;
