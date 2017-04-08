
/**
 * geopano-block.js
 * GeoPano block component
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';

/**
 *
 */
const GeoPanoBlock = (props) => {
  const data = props.data;
  const geopanos = data.geopanos.map((url, idx) => {
    return <iframe
              key={idx}
              className="geopano"
              src={url}
              frameBorder="0"
              allowFullScreen/>
  });
  return (
    <div className="geopano-block">
      <div className="geopano-block-header">
        <h1>{ data.title }</h1>
        <h5>{ data.location }</h5>
      </div>
      <div className="geopano-block-content">
        { geopanos }
      </div>
    </div>
  )
};


export default GeoPanoBlock;
