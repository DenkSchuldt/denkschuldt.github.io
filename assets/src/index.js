
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
import GeoPanosHandy from './geopanos-handy';

/**
 *
 */
const Index = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/360" component={GeoPanosResponsive} />
      </Switch>
    </Router>
  )
};

const GeoPanosResponsive = () => {
  if ($(window).width() > 500) {
    return <GeoPanos/>;
  }
  return <GeoPanosHandy/>;
}

/**
 *
 */
$(document).ready(()=>{
  ReactDOM.render(<Index/>, document.getElementById('index'));
});

document.addEventListener('scroll', function(evt) {
  let scrollTop = $("body").scrollTop();
  if (scrollTop > 160) {
    $('.header').fadeIn('fast');
  } else {
    $('.header').fadeOut('fast');
  }
})
