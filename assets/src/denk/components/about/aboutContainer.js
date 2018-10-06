
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
          ¡Hola! Soy Denny K. Schuldt y soy un Ingeniero en Ciencias Computacionales.
          Me considero un desarrollador movido por el conocimiento, con un interés especial en UX y código de calidad.
          Me gusta tomar fotos en 360 para capturar lugares en los que he estado.
          Realmente espero que encuentres este sitio inspirador. ¡Disfrútalo!
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
