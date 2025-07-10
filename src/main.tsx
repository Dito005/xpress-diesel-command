import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { electronAPI } from '@/lib/electron';

// Initialize safely
electronAPI.on('app-ready', () => {
  console.log('Electron app is ready');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);