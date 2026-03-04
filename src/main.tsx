import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';

// ==========================================
// 🚀 VERCEL PRODUCTION API REDIRECTOR
// ==========================================
// Any hardcoded 'http://localhost:5000/api' will be dynamically mapping to 
// the deployed Vercel backend based on the environmental variable.
const PROD_API = import.meta.env.VITE_API_URL;
if (PROD_API) {
  axios.interceptors.request.use(config => {
    if (config.url && config.url.includes('http://localhost:5000/api')) {
      config.url = config.url.replace('http://localhost:5000/api', PROD_API);
    }
    return config;
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
