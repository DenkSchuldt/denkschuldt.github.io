/**
 * index.js
 * Geopanos handy reducer
 *
 * @version 1.1
 * @author  Denny K. Schuldt
 *
 */

import { List, Map } from 'immutable';

import * as types from '../constants/action-types';


const initialState = new Map({
  loading: false,
  index: 0,
  data: List()
})


const requestGeoPanosStarted = (state) => {
  return state;
}

const requestGeoPanosSucceed = (state, action) => {
  return state.set('data', List(action.payload));
}

const requestGeoPanosFailed = (state, action) => {
  return state;
}

const requestGeoPanosFinished = (state) => {
  return state;
}

const previousGeoPano = (state) => {
  const index = state.get('index');
  if (index > 0) {
    return state.set('index', index - 1);
  }
  return state;
}

const nextGeoPano = (state) => {
  const index = state.get('index');
  if (index < state.get('data').size - 1) {
    return state.set('index', index + 1);
  }
  return state;
}


export default (state = initialState, action) => {
  switch (action.type) {
    case types.REQUEST_GEOPANOS_STARTED:
      return requestGeoPanosStarted(state);
    case types.REQUEST_GEOPANOS_SUCCEED:
      return requestGeoPanosSucceed(state, action);
    case types.REQUEST_GEOPANOS_FAILED:
      return requestGeoPanosFailed(state, action);
    case types.REQUEST_GEOPANOS_FINISHED:
      return requestGeoPanosFinished(state);
    case types.PREVIOUS_GEOPANO:
      return previousGeoPano(state);
    case types.NEXT_GEOPANO:
      return nextGeoPano(state);
    default:
      return state;
  }
}
