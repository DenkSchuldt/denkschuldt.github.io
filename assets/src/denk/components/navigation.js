/**
 *
 */

import React from 'react';
import { Link } from 'react-router-dom';

import './navigation.css';


const Navigation = (props) => {
  return (
    <div className="navigation">
      <Link to="/" className="navigation-option">Inicio</Link>
      <Link to="/about" className="navigation-option">Acerca de</Link>
    </div>
  )
}


module.exports = Navigation;
