
/**
 * header.js
 * Header component
 *
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';
import { Link } from 'react-router-dom';

import './header.css';

/**
 *
 */
const Header = () => {
  return (
    <header className="header">
      <div className="header-options">
        <Link to="/" className="header-option">Home</Link>
        <Link to="/about" className="header-option">About me</Link>
      </div>
      <div>
        <h1>360º</h1>
        <p>Una foto a la vez.</p>
        <div className="header-scrolled">
          <h2>360º</h2>
          <div className="header-scrolled-options">
            <Link to="/" className="header-scrolled-option">Home</Link>
            <Link to="/about" className="header-scrolled-option">About me</Link>
          </div>
        </div>
      </div>
    </header>
  )
}


export default Header;
