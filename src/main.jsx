import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'

// Router shape is build-dependent (see vite.config.js): clean-URL BrowserRouter for
// the hosted root-domain build + dev server; HashRouter for the GitHub-Pages
// sub-path mirror and the file:// single-file build. __USE_HASH_ROUTER__ is
// replaced at build time by Vite's define.
const Router = __USE_HASH_ROUTER__ ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
