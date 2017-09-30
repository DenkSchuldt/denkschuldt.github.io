
/**
 * loading.js
 * Loading component
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import { h } from 'preact';


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
