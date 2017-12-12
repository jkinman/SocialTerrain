/* eslint-disable import/newline-after-import */
/* Exports all the actions from a single point.

Allows to import actions like so:

import {action1, action2} from '../actions/'
*/
/* Populated by react-webpack-redux:action */
import setOrientation from '../actions/setOrientation.js';
import newTweet from '../actions/newTweet.js';
import panCamera from '../actions/panCamera.js';
const actions = {
  panCamera,
  newTweet,
  setOrientation
};
module.exports = actions;
