
/**
 * index.js
 * Geopanos actions
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import $ from 'jquery';

import * as types from '../constants/action-types';


/***************************************/
/************ PLAIN ACTIONS ************/
/***************************************/

export function loadGeoPanosStarted() {
  return {
    type: types.LOAD_GEOPANOS_STARTED
  }
}

export function loadGeoPanosFinished() {
  return {
    type: types.LOAD_GEOPANOS_FINISHED
  }
}

export function loadGeoPanosSucceed(payload) {
  return {
    type: types.LOAD_GEOPANOS_SUCCEED,
    payload
  }
}

export function loadGeoPanosFailed(payload) {
  return {
    type: types.LOAD_GEOPANOS_FAILED
  }
}


/***************************************/
/************ ASYNC ACTIONS ************/
/***************************************/

export function loadGeoPanos() {
  return (dispatch, getState) => {
    dispatch(loadGeoPanosStarted());
    return $.ajax({
      method: "GET",
      url: 'assets/json/geopanos.json',
      dataType: "json"
    }).done((data) => {
      dispatch(loadGeoPanosSucceed(data));
    }).fail((err) => {
      dispatch(loadGeoPanosFailed(err));
    }).always(() => {
      dispatch(loadGeoPanosFinished());
    });
  }
}
