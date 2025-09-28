import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from './WebApp';

// Initialize Telegram WebApp (if available)
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WebApp />
  </React.StrictMode>
);