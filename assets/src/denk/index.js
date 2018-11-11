
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
import { BrowserRouter as Router, Route } from 'react-router-dom';

import reducer from './reducers';
import { actions } from './actions/geopano';
import Navigation from './components/navigation';
import AboutContainer from './components/about/aboutContainer.js';
import GeoPanoContainer from './components/geopano/geopanoContainer.js';

import data from '../../json/geopanos.1.2.5.json';


const store = createStore(reducer);

/**
 *
 */
const Main = () => {
  store.dispatch(actions.updateGeoPanosData({ data }));
  return (
    <Provider store={store}>
      <div>
        <Router>
          <div>
            <Navigation/>
            <Route exact path="/" component={GeoPanoContainer}/>
            <Route path="/about" component={AboutContainer}/>
          </div>
        </Router>
      </div>
    </Provider>
  )
}


export default Main;
