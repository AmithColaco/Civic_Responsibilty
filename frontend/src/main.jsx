import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 1. Import the router engine
import App from './App.jsx';
import './index.css'; // Your global styling rules

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* 2. Wrap App inside the Router context */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);