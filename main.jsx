import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx'
import './style.css' // Ensure this matches your actual CSS file name

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
