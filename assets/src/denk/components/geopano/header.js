
/**
 * header.js
 * Header component
 *
 * @author  Denny K. Schuldt
 *
 */

import React from 'react';


/**
 *
 */
const Header = (props) => {
  return (
    <header className="header">
      <div>
        <h1>Aventuras en 360º</h1>
        <p>Una foto a la vez.</p>
        <div className="header-scrolled">
          <h2>Aventuras en 360º</h2>
          <div className="header-scrolled-options">
            <span
              onClick={props.showAboutMe}
              className="header-scrolled-option">
              Sobre mi
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}


export default Header;
