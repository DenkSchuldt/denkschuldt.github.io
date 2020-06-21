
import React from 'react';

import './Header.scss';


const Header = ({ style }) => {
  return (
    <header style={style}>
      <h1>Aventuras en 360º</h1>
      <div>
        <a
          target='_blank'
          rel='noopener noreferrer'
          href='https://github.com/DenkSchuldt'>
          <i className="fab fa-github"></i>
        </a>
        <a
          target='_blank'
          rel='noopener noreferrer'
          href='https://twitter.com/DenkSchuldt'>
          <i className="fab fa-twitter"></i>
        </a>
        <a
          target='_blank'
          rel='noopener noreferrer'
          href='https://www.instagram.com/denkschuldt/'>
          <i className="fab fa-instagram"></i>
        </a>
      </div>
    </header>
  )
}

export default Header;
