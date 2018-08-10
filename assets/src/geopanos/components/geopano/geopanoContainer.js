
import $ from 'jquery';
import React from 'react';
import { connect } from 'react-redux';
import ReduxInfiniteScroll from 'redux-infinite-scroll';

import GeoPano from './geopano';
import GeoPanoMobile from './geopanoMobile';
import { actions } from '../../actions/geopano';

import './geopano.css'


/**
 *
 */
class GeoPanoContainer extends React.Component {
  renderGeoPanos() {
    const state = this.props.state;
    return state.get('list').map((geopano, idx) => {
      return <GeoPano
                key={idx}
                data={geopano}/>;
    }).toArray()
  }
  render() {
    let index = this.props.state.get('index');
    let data = this.props.state.getIn(['data', index]);
    const loadGeoPanos = () => {
      this.props.loadGeoPanos();
    }
    return (
      <div className="geopanos">
        <ReduxInfiniteScroll
          items={this.renderGeoPanos()}
          loadMore={loadGeoPanos}
          threshold={100}
          elementIsScrollable={false}/>
        <GeoPanoMobile
          data={data}
          index={index}
          onNextGeoPano={this.props.onNextGeoPano}
          onPreviousGeoPano={this.props.onPreviousGeoPano}
          totalPictures={this.props.state.get('data').size}/>
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
    },
    onPreviousGeoPano: () => {
      dispatch(actions.previousGeoPano())
    },
    onNextGeoPano: () => {
      dispatch(actions.nextGeoPano())
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GeoPanoContainer)
