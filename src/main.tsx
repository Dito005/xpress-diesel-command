import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { electronAPI } from '@/lib/electron'

// Initialize Electron app safely
const initElectron = () => {
  if (electronAPI.isElectron()) {
    console.log('Running in Electron environment');
    electronAPI.send('app-ready');
  } else {
    console.log('Running in browser environment');
  }
};

// Initialize app
initElectron();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);