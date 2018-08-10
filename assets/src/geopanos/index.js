
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
import Header from './components/header.js';
import GeoPanoContainer from './components/geopano/geopanoContainer.js';

import data from '../../json/geopanos.1.2.4.json';


const store = createStore(reducer);

/**
 *
 */
const Main = () => {
  store.dispatch(actions.updateGeoPanosData({ data }));
  return (
    <Provider store={store}>
      <div>
        <Header/>
        <GeoPanoContainer/>
      </div>
    </Provider>
  )
}


export default Main;
