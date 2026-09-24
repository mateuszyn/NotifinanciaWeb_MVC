import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/style.css'; // Reaproveitando seu CSS global


// Encontra a div <div id="app"></div> no seu index.html e injeta o React lá dentro
ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
