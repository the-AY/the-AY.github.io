import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initMockBackend } from './mockBackend.js'

if (import.meta.env.VITE_STATIC_MODE === 'true') {
  console.log('Running in Static Mock Mode (localStorage DB)');
  initMockBackend();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
