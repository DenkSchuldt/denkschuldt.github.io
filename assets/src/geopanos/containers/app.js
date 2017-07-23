
/**
 * app.js
 * Geopanos app container
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import { h, Component } from 'preact';
import { connect } from 'preact-redux';

import Header from '../components/header.js';
import GeoPanoContainer from './geopano-container.js';


class App extends Component {
  render() {
    return (
      <div>
        <Header/>
        <GeoPanoContainer/>
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
