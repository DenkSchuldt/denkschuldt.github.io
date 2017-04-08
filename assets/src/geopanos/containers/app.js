
/**
 * app.js
 * Geopanos app container
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import * as actions from '../actions';
import GeoPanoBlock from '../components/geopano-block.js';


class App extends Component {
  render() {
    const state = this.props.state;
    let blocks = state.get('blocks').map((block, idx) => {
      return <GeoPanoBlock
                key={idx}
                data={block}/>;
    })
    return (
      <div id="geopanos">
        { blocks }
      </div>
    )
  }
}


const mapStateToProps = state => {
  return {
    state
  }
}

const mapDispatchToProps = dispatch => {
  return {
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
