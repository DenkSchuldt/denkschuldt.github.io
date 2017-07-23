
/**
 * geopano.js
 * GeoPano Mobile component
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import { h } from 'preact';
import ArrowLeft from '../../../images/arrow-left.svg';
import ArrowRight from '../../../images/arrow-right.svg';

/**
 *
 */
const GeoPanoMobile = (props) => {
  const data = props.data;
  return (
    <div className="geopano-mobile">
      <div className="geopano-mobile-header">
        <div className="geopano-header-left">
          <h3>{ data.title }</h3>
          <label>{ data.location }</label>
          <label>
            {props.index + 1}/{props.totalPictures}
          </label>
        </div>
        <div className="geopano-header-right">
          <h3>360º</h3>
        </div>
      </div>
      <div className="geopano-mobile-body">
        <iframe
          src={data.url}
          frameBorder="0"
          allowFullScreen/>
      </div>
      <div className="geopano-mobile-footer">
        <img
          src={"dist/"+ArrowLeft}
          alt="previous"
          onClick={props.onPreviousGeoPano}/>
        <img
          src={"dist/"+ArrowRight}
          alt="next"
          onClick={props.onNextGeoPano}/>
      </div>
    </div>
  )
}


module.exports = GeoPanoMobile;
