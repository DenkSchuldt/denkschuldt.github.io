
/**
 * header.js
 * Header component
 *
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';
import { Link } from 'react-router-dom';


/**
 *
 */
const Header = () => {
  return (
    <header className="header">
      <div>
        <h1>360º</h1>
        <p>Una foto a la vez.</p>
        <div className="header-scrolled">
          <h2>360º</h2>
          <div className="header-scrolled-options">
            <Link to="/" className="header-scrolled-option">Inicio</Link>
            <Link to="/about" className="header-scrolled-option">Acerca de</Link>
          </div>
        </div>
      </div>
    </header>
  )
}


export default Header;
