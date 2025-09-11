import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // No BrowserRouter here
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* Just render App without Router wrapper */}
  </React.StrictMode>,
);