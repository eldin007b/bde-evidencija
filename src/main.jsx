import './index.css';
import 'leaflet/dist/leaflet.css'; // Leaflet CSS stilovi za pravilno renderovanje mape
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'

// PWA READY - Push Notifications & Enhanced Features
if (import.meta.env.DEV) {
  console.log('🚀 BD Evidencija v5.0.0 - PWA READY WITH PUSH NOTIFICATIONS - 20251018');
  console.log('📱 PWA Status: Ready for Installation');
  console.log('🔔 Push Notifications: Enabled');
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', {
      scope: './'
    })
    .then((registration) => {
      if (import.meta.env.DEV) {
        console.log('✅ Service Worker registered successfully:', registration);
        console.log('📱 PWA Install will be available after meeting criteria');
      }
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
    });
  });

  // Automatski reload kad se pojavi novi service worker
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    window.location.reload();
  });
}

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
