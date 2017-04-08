
/**
 * index.js
 * Index file
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import {
  HashRouter as Router,
  Switch,
  Route
} from 'react-router-dom';

import '../css/main.scss';
import Home from './home.js';
import GeoPanos from './geopanos';

/**
 *
 */
const Index = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/360" component={GeoPanos} />
      </Switch>
    </Router>
  )
};

/**
 *
 */
$(document).ready(()=>{
  ReactDOM.render(<Index/>, document.getElementById('index'));
});
