
/**
 * geopano.js
 * GeoPano component
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';

/**
 *
 */
const GeoPano = (props) => {
  const data = props.data;
  console.log(data);
  return (
    <div className="geopano">
      <div className="geopano-header">
        <h3>{ data.title }</h3>
        <p>{ data.location }</p>
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
