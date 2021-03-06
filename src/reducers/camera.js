/* Define your initial state here.
 *
 * If you change the type from object to something else, do not forget to update
 * src/container/App.js accordingly.
 */
import {PAN_CAMERA, SET_ORIENTATION} from '../actions/const';

const initialState = {orientation: [0,0,0]};

function reducer(state = initialState, action) {
  /* Keep the reducer clean - do not mutate the original state. */
  // const nextState = Object.assign({}, state);

  switch (action.type) {
    /*
    case YOUR_ACTION: {
      // Modify next state depending on the action and return it
      return nextState;
    }
    */
    case SET_ORIENTATION: {
      return {...state, orientation: action.orientation};
    }
    case PAN_CAMERA: {
      return state;
    }
    default: {
      /* Return original state if no actions were consumed. */
      return state;
    }
  }
}

module.exports = reducer;
