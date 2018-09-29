
import $ from 'jquery';
import React from 'react';
import { connect } from 'react-redux';

import './about.css';

import Me from './../../../../images/me.jpg';


/**
 *
 */
class AboutContainer extends React.Component {
  render() {
    return (
      <div className="about-container">
        <img src={Me}/>
        <div className="about">
            Hi, I'm Denny K. Schuldt and I'm a Computer science graduate. I'm a knowledge driven developer with a special interest in UX and code quality. I like taking 360 photos to capture places I've been in. I really hope you find this page inspiring. Enjoy it!
        </div>
        <div className="about-social">
            <a href="https://github.com/DenkSchuldt" target="_blank">Github</a>
            <a href="https://twitter.com/DenkSchuldt" target="_blank">Twitter</a>
            <a href="https://www.instagram.com/denkschuldt" target="_blank">Instagram</a>
        </div>
      </div>
    )
  }
}


const mapStateToProps = state => {
  return {
    state
  }
}

export default connect(
  mapStateToProps
)(AboutContainer)
