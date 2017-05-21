
/**
 * geopano.js
 * GeoPano component
 *
 * @version 1.1
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';
import $ from 'jquery';

/**
 *
 */
const GeoPano = (props) => {

  let data = {};

  if (props.state.get('data').size) {
    const index = props.state.get('index');
    data = props.state.get('data').get(index);
  }

  return (
    <div className="geopano">
      <div className="geopano-header">
        <div className="geopano-header-content">
          <h3>{ data.title }</h3>
          <p>{ data.location }</p>
          <label>{ (props.state.get('index') + 1) + "/" + props.state.get('data').size }</label>
        </div>
        <div className="geopano-header-title">
          <h3>360º</h3>
        </div>
      </div>
      <div className="geopano-content">
        <iframe
          src={data.url}
          className="geopano"
          frameBorder="0"
          allowFullScreen/>
      </div>
    </div>
  )
};


export default GeoPano;
