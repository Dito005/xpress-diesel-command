import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { electronAPI } from '@/lib/electron'

// Initialize any Electron-specific functionality
if (electronAPI.isElectron()) {
  electronAPI.send('app-ready');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)