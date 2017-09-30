
/**
 * header.js
 * Header component
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import { h } from 'preact';

/**
 *
 */
const Header = () => {
  return (
    <div className="header">
      <h1>360º</h1>
      <p>Una foto a la vez.</p>
      <div className="header-scrolled">
        <h2>360º</h2>
      </div>
    </div>
  )
}


export default Header;
