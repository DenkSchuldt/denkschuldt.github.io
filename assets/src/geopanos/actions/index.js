
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

export function requestGeoPanosStarted() {
  return {
    type: types.REQUEST_GEOPANOS_STARTED
  }
}

export function requestGeoPanosFinished() {
  return {
    type: types.REQUEST_GEOPANOS_FINISHED
  }
}

export function requestGeoPanosSucceed(payload) {
  return {
    type: types.REQUEST_GEOPANOS_SUCCEED,
    payload
  }
}

export function requestGeoPanosFailed(payload) {
  return {
    type: types.REQUEST_GEOPANOS_FAILED,
    payload
  }
}

export function loadGeoPanos() {
  return {
    type: types.LOAD_GEOPANOS
  }
}


/***************************************/
/************ ASYNC ACTIONS ************/
/***************************************/

export function requestGeoPanos() {
  return (dispatch, getState) => {
    dispatch(requestGeoPanosStarted());
    return $.ajax({
      method: "GET",
      url: 'assets/json/geopanos.json',
      dataType: "json"
    }).done((data) => {
      dispatch(requestGeoPanosSucceed(data));
    }).fail((err) => {
      dispatch(requestGeoPanosFailed(err));
    }).always(() => {
      dispatch(requestGeoPanosFinished());
    });
  }
}
