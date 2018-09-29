
/**
 * loading.js
 * Loading component
 *
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';

import './loading.css'


const Loading = () => (
  <div className="loading">
    <div className="ring">
	    <div className="ball">
		    <div className="ballG"></div>
	    </div>
    </div>
  </div>
)


module.exports = Loading
