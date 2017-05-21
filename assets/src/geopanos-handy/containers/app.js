
/**
 * app.js
 * Geopanos app container
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import React, { Component } from 'react';

import GeoPanoContainer from './geopano-container.js';
import NavigatorContainer from './navigator-container.js';


class App extends Component {
  render() {
    return (
      <div id="geopanos-handy">
        <GeoPanoContainer/>
        <NavigatorContainer/>
      </div>
    )
  }
}

export default App;
