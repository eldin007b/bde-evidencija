import './index.css';
import 'leaflet/dist/leaflet.css'; // Leaflet CSS stilovi za pravilno renderovanje mape
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'

// ULTRA NUCLEAR CACHE BUST - Force browser to recognize new version
console.log('🚀 BDEVidencija v5.0.0 - ULTRA NUCLEAR FORCE UPDATE - 20251020-HOOKS-FIXED');
console.log('📱 PWA Cache Status: FORCED REFRESH');

// Automatski reload kad se pojavi novi service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    window.location.reload();
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
