
/**
 * index.js
 * Geopanos actions
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import * as types from '../constants/action-types';


/***************************************/
/************ PLAIN ACTIONS ************/
/***************************************/

export const updateGeoPanosData = (payload) => {
  return {
    type: types.UPDATE_GEOPANOS_DATA,
    payload
  }
}

export const loadGeoPanos = () => {
  return {
    type: types.LOAD_GEOPANOS
  }
}

export const previousGeoPano = () => {
  return {
    type: types.PREVIOUS_GEOPANO
  }
}

export const nextGeoPano = () => {
  return {
    type: types.NEXT_GEOPANO
  }
}
