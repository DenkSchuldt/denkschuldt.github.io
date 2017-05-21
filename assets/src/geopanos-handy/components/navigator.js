
/**
 * footer.js
 * Footer component
 *
 * @version 1.1
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';

/**
 *
 */
const Navigator = (props) => {
  return (
    <div className="navigator">
      <div
        onClick={props.onPreviousGeoPano}
        className={
          props.state.get('index') == 0 ?
          "navigator-arrow navigator-arrow-left hidden" :
          "navigator-arrow navigator-arrow-left"}>
        <i className="fa fa-arrow-left" aria-hidden="true"></i>
      </div>
      <div
        onClick={props.onNextGeoPano}
        className={
          props.state.get('index') == props.state.get('data').size - 1 ?
          "navigator-arrow navigator-arrow-right hidden" :
          "navigator-arrow navigator-arrow-right"}>
        <i className="fa fa-arrow-right" aria-hidden="true"></i>
      </div>
    </div>
  )
}


export default Navigator;
