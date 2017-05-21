
import React, { Component } from 'react';
import { connect } from 'react-redux';

import * as actions from '../actions';
import GeoPano from '../components/geopano';


const GeoPanoContainer = (props) => {
  return (
    <GeoPano {...props}/>
  )
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
)(GeoPanoContainer)
