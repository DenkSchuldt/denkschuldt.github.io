
/**
 * geopano.js
 * GeoPano component
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import { h } from 'preact';
import Loading from './loading.js'


/**
 *
 */
const GeoPano = (props) => {
  const data = props.data;
  return (
    <div className="geopano">
      <div className="geopano-header">
        <h3>{ data.title }</h3>
        <p>{ data.location }</p>
      </div>
      <div className="geopano-body">
        <Loading/>
        <iframe
          src={data.url}
          frameBorder="0"
          allowFullScreen/>
      </div>
    </div>
  )
};


export default GeoPano;
