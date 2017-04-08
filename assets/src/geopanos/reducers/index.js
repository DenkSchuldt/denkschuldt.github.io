
/**
 * index.js
 * Geopanos reducer
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import { List, Map } from 'immutable';

import * as types from '../constants/action-types';


const initialState = new Map({
  loading: false,
  blocks: List()
})


const loadGeoPanosStarted = (state) => {
  return state.set('loading', true);
}

const loadGeoPanosFinished = (state) => {
  return state.set('loading', false);
}

const loadGeoPanosSucceed = (state, action) => {
  return state.set('blocks', List(action.payload));
}

const loadGeoPanosFailed = (state, action) => {
  console.log(action);
  return state;
}

export default (state = initialState, action) => {
  switch (action.type) {
    case types.LOAD_GEOPANOS_STARTED:
      return loadGeoPanosStarted(state);
    case types.LOAD_GEOPANOS_FINISHED:
      return loadGeoPanosFinished(state);
    case types.LOAD_GEOPANOS_SUCCEED:
      return loadGeoPanosSucceed(state, action);
    case types.LOAD_GEOPANOS_FAILED:
      return loadGeoPanosFailed(state, action);
    default:
      return state;
  }
}
