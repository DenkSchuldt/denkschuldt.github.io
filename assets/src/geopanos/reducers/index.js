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
  index: 0,
  data: List(),
  list: List()
})


const requestGeoPanosStarted = (state) => {
  return state.set('loading', true);
}

const requestGeoPanosFinished = (state) => {
  return state.set('loading', false);
}

const requestGeoPanosSucceed = (state, action) => {
  return state.set('data', List(action.payload));
}

const requestGeoPanosFailed = (state, action) => {
  return state;
}

const loadGeoPanos = (state, action) => {
  let controller = 0;
  let newList = state.get('list');
  state.get('data').map((geopano, idx) => {
    if (idx >= newList.size && controller < 4) {
      newList = newList.push(geopano)
      controller += 1;
    }
  })
  return state.set('list', newList);
}

export default (state = initialState, action) => {
  switch (action.type) {
    case types.REQUEST_GEOPANOS_STARTED:
      return requestGeoPanosStarted(state);
    case types.REQUEST_GEOPANOS_FINISHED:
      return requestGeoPanosFinished(state);
    case types.REQUEST_GEOPANOS_SUCCEED:
      return requestGeoPanosSucceed(state, action);
    case types.REQUEST_GEOPANOS_FAILED:
      return requestGeoPanosFailed(state, action);
    case types.LOAD_GEOPANOS:
      return loadGeoPanos(state);
    default:
      return state;
  }
}
