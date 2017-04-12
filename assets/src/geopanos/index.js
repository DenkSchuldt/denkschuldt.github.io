
/**
 * index.js
 * Geopanos module
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import $ from 'jquery';
import React from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import * as actions from './actions';
import reducer from './reducers';
import App from './containers/app.js';


const middleware = [thunk];
const store = createStore(
  reducer,
  applyMiddleware(...middleware)
);

/**
 *
 */
const Main = () => {
  store.dispatch(actions.requestGeoPanos());
  return (
    <Provider store={store}>
      <App/>
    </Provider>
  )
}


export default Main;
