import { NEW_TWEET } from './const';

function action(parameter) {
  return { type: NEW_TWEET, parameter };
}

module.exports = action;
