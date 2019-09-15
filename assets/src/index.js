
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

window.toggleHeader = (evt) => {
  let scrollTop = $("html").scrollTop();
  if (scrollTop > 160) {
    $('.header-scrolled').css('opacity', '1');
  } else {
    $('.header-scrolled').css('opacity', '0');
  }
};

render(
  <Denk/>,
  document.getElementById('index')
);


$(window).on('scroll', window.toggleHeader);
