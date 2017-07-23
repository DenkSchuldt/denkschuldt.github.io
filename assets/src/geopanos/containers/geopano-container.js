
import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import ReduxInfiniteScroll from 'redux-infinite-scroll';
import $ from 'jquery';

import * as actions from '../actions';
import GeoPano from '../components/geopano';
import GeoPanoMobile from '../components/geopano-mobile';


class GeoPanoContainer extends Component {
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
          elementIsScrollable={false}
          threshold={100}/>
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
