
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
import ReduxInfiniteScroll from 'redux-infinite-scroll';

import * as actions from '../actions';
import Header from '../components/header.js';
import GeoPano from '../components/geopano.js';


class App extends Component {
  renderGeoPanos() {
    const state = this.props.state;
    return state.get('list').map((geopano, idx) => {
      return <GeoPano
                key={idx}
                data={geopano}/>;
    }).toArray()
  }
  render() {
    const loadGeoPanos = () => {
      this.props.loadGeoPanos();
    }
    return (
      <div id="geopanos">
        <Header/>
        <div className="geopanos-header">
          <h1>360º</h1>
          <p>Una foto a la vez.</p>
        </div>
        <ReduxInfiniteScroll
          items={this.renderGeoPanos()}
          loadMore={loadGeoPanos}
          elementIsScrollable={false}
          threshold={100}/>
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
    loadGeoPanos: () => {
      dispatch(actions.loadGeoPanos())
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
