import { SET_ORIENTATION } from './const';

function action(orientation) {
  return { type: SET_ORIENTATION, orientation };
}

module.exports = action;
