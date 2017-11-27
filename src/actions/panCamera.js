import { PAN_CAMERA } from './const';

function action(parameter) {
  return { type: PAN_CAMERA, parameter };
}

module.exports = action;
