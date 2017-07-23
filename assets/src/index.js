
/**
 * index.js
 * Index file
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import { h, render } from 'preact';
import Router from 'preact-router';
import $ from 'jquery';

import '../styles/main.scss';
import GeoPanos from './geopanos';


render(
  <Router>
    <GeoPanos path="/"/>
  </Router>,
  document.getElementById('index')
);


document.addEventListener('scroll', function(evt) {
  let scrollTop = $("body").scrollTop();
  if (scrollTop > 160) {
    $('.header-scrolled').fadeIn('fast');
  } else {
    $('.header-scrolled').fadeOut('fast');
  }
})
