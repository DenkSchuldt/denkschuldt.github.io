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


/**
 *
 */
const updateGeoPanosData = (state, action) => {
  return state.set('data', List(action.payload.data));
}

/**
 *
 */
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

/**
 *
 */
const previousGeoPano = (state) => {
  const index = state.get('index');
  if (index > 0) {
    return state.set('index', index - 1);
  }
  return state;
}

/**
 *
 */
const nextGeoPano = (state) => {
  const index = state.get('index');
  if (index < state.get('data').size - 1) {
    return state.set('index', index + 1);
  }
  return state;
}


/**********************************************/
/**********************************************/
/**********************************************/


export default (state = initialState, action) => {
  switch (action.type) {
    case types.UPDATE_GEOPANOS_DATA:
      return updateGeoPanosData(state, action);
    case types.LOAD_GEOPANOS:
      return loadGeoPanos(state);
    case types.PREVIOUS_GEOPANO:
      return previousGeoPano(state);
    case types.NEXT_GEOPANO:
      return nextGeoPano(state);
    default:
      return state;
  }
}
