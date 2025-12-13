import './index.css';
import 'leaflet/dist/leaflet.css';
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'

// Global error logging
window.addEventListener('error', (event) => {
  console.error('🚨 [GLOBAL] Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 [GLOBAL] Unhandled promise rejection:', event.reason);
});

// ULTRA NUCLEAR CACHE BUST
console.log('🚀 BDEVidencija v5.0.0 - ULTRA NUCLEAR FORCE UPDATE - 20251213-REORGANIZED');
console.log('📱 PWA Cache Status: STABLE v5');

// Service Worker - safe reload (max 1x)
if ('serviceWorker' in navigator) {
  let hasReloaded = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hasReloaded) {
      hasReloaded = true;
      console.log('🔄 [APP] Service worker controllerchange – jedan reload');
      window.location.reload();
    }
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
