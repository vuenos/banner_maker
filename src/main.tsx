import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initAnalytics } from './analytics'
import './index.css'

initAnalytics()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
