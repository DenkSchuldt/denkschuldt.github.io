
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
      <p>
        Un proyecto de&nbsp;
        <a href="https://twitter.com/DenkSchuldt" target="_blank">Denny</a>&nbsp;
        <a href="https://github.com/DenkSchuldt" target="_blank">K.</a>&nbsp;
        <a href="https://www.instagram.com/denkschuldt/" target="_blank">Schuldt</a></p>
      <div className="header-scrolled">
        <h2>360º</h2>
      </div>
    </div>
  )
}


export default Header;
