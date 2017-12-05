
/**
 * index.js
 * Geopanos module
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import { h } from 'preact';
import { Provider, connect } from 'preact-redux';
import { createStore, applyMiddleware } from 'redux';

import * as actions from './actions';
import reducer from './reducers';
import App from './containers/app.js';

import data from '../../json/geopanos.v1.2.2.json';

const store = createStore(reducer);

/**
 *
 */
const Main = () => {
  store.dispatch(actions.updateGeoPanosData({ data }));
  return (
    <Provider store={store}>
      <App/>
    </Provider>
  )
}


export default Main;
