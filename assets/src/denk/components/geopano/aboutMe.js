/**
 *
 *
 */

import $ from 'jquery';
import React from 'react';

import ME from './../../../../images/me.jpg';
import close from './../../../../images/close.svg';
import github from './../../../../images/github.svg';
import twitter from './../../../../images/twitter.svg';
import instagram from './../../../../images/instagram.svg';

import './aboutMe.css';


/**
 *
 */
export default class AboutMe extends React.Component {
  componentDidMount() {
    $(window).unbind('scroll');
  }
  componentWillUnmount() {
    $(window).on('scroll', window.toggleHeader);
  }
  render() {
    return (
      <div
        className='advt-about-me'
        onClick={this.props.onClose}>
        <div className='advt-about-me-content-wrapper'>
          <div
            className='advt-about-me-content'
            onClick={(e) => e.stopPropagation()}>
            <header>
              <img src={ME} alt=''/>
            </header>
            <section>
              <p>
                ¡Hola!
                <br/>
                Soy Denny, y soy un Ingeniero en Ciencias Computacionales.
              </p>
              <p>
                Me considero un desarrollador movido por el conocimiento, con un interés especial en UX (User experience) y código de calidad.
              </p>
              <p>
                Me gusta tomar fotos en 360º para capturar lugares que he visitado, y poder mostrar su belleza al mundo.
              </p>
              <p>
                Realmente espero que encuentres este sitio inspirador. ¡Disfrútalo!
              </p>
            </section>
            <footer>
              <span
                className='close'
                onClick={this.props.onClose}>
                <img src={close} alt='cerrar'/>
              </span>
              <div className='flex'>
                <a href="https://github.com/DenkSchuldt" target="_blank">
                  <img src={github} alt='Github'/>
                </a>
                <a href="https://twitter.com/DenkSchuldt" target="_blank">
                  <img src={twitter} alt='twitter'/>
                </a>
                <a href="https://www.instagram.com/denkschuldt" target="_blank">
                  <img src={instagram} alt='instagram'/>
                </a>
              </div>
            </footer>
          </div>
        </div>
      </div>
    )
  }
}
