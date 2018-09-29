
/**
 * geopano.js
 * GeoPano component
 *
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';
import ReactDOM from 'react-dom';

import Loading from './../loading.js';


/**
 *
 */
class Iframe extends React.Component {
  componentDidMount() {
    const dom = ReactDOM.findDOMNode(this);
    dom.addEventListener('load', this.props.onLoad);
  }
  render() {
    return (
      <iframe
        frameBorder="0"
        allowFullScreen
        src={this.props.src}/>
    )
  }
}

/**
 *
 */
class GeoPano extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      data: this.props.data
    }
    this.onLoad = this.onLoad.bind(this)
  }
  onLoad(isLoaded) {
    this.setState({
      isLoaded
    })
  }
  render() {
    return (
      <div className="geopano">
        <div className="geopano-header">
          <div className="geopano-header-content">
            <span className="geopano-header-index">
              { this.props.index }
            </span>
            <div>
              <h3>{ this.state.data.title }</h3>
              <p>{ this.state.data.location }</p>
            </div>
          </div>
        </div>
        <div className="geopano-body">
          {
            !this.state.isLoaded &&
            <Loading/>
          }
          <Iframe
            src={this.state.data.url}
            frameBorder="0"
            allowFullScreen
            onLoad={() => this.onLoad(true)}/>
        </div>
      </div>
    )
  }
};


export default GeoPano;
