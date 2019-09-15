
/**
 * geopano.js
 * GeoPano Mobile component
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';
import info from './../../../../images/info.svg';
import ArrowLeft from './../../../../images/arrow-left.svg';
import ArrowRight from './../../../../images/arrow-right.svg';

/**
 *
 */
const GeoPanoMobile = (props) => {
  const { data, showAboutMe } = props;
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
        {
          (props.index > 0) &&
          <img
            src={ArrowLeft}
            alt="previous"
            onClick={props.onPreviousGeoPano}/>
        }
        {
          ((props.index+1) < props.totalPictures) &&
          <img
            src={ArrowRight}
            alt="next"
            className="pull-right"
            onClick={props.onNextGeoPano}/>
        }
      </div>
      <span
        className='advt-about-me-mobile'
        onClick={showAboutMe}>
        <img src={info}/>
      </span>
    </div>
  )
}


module.exports = GeoPanoMobile;
