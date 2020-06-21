
import React from 'react';
import ReactDOM from 'react-dom';

import App from './components';
import * as serviceWorker from './serviceWorker';

import './index.css';


document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('AventurasEn360')
  );
});

serviceWorker.unregister();
