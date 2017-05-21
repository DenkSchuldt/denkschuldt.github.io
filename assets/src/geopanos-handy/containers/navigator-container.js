

import React, { Component } from 'react';
import { connect } from 'react-redux';
import $ from 'jquery';

import * as actions from '../actions';
import Navigator from '../components/navigator';




const NavigatorContainer = (props) => {
  return (
    <Navigator {...props}/>
  )
}

const mapStateToProps = state => {
  return {
    state
  }
}

const mapDispatchToProps = dispatch => {
  return {
    onPreviousGeoPano: () => {
      dispatch(actions.previousGeoPano());
    },
    onNextGeoPano: () => {
      dispatch(actions.nextGeoPano());
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NavigatorContainer)
