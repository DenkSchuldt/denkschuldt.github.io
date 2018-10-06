
/**
 * index.js
 * Index file
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import $ from 'jquery';
import React from 'react';
import { render } from 'react-dom';

import Denk from './denk';


render(
  <Denk/>,
  document.getElementById('index')
);


$(window).on('scroll', function(evt) {
  let scrollTop = $("html").scrollTop();
  if (scrollTop > 160) {
    $('.header-scrolled').css('display', 'flex');
  } else {
    $('.header-scrolled').css('display', 'none');
  }
})
