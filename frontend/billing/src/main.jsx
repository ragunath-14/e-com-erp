import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './api/authInterceptor.js'
import App from './App.jsx'
import { registerServiceWorker } from './utils/pwaInstall.js'

registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
