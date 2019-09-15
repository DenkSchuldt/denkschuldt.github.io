
/**
 * index.js
 * Geopanos module
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import reducer from './reducers';
import { actions } from './actions/geopano';
import Geopano from './components/geopano/';

import data from '../../json/geopanos.1.3.0.json';


const store = createStore(reducer);

/**
 *
 */
const Main = () => {
  store.dispatch(actions.updateGeoPanosData({ data }));
  return (
    <Provider store={store}>
      <Geopano/>
    </Provider>
  )
}


export default Main;
