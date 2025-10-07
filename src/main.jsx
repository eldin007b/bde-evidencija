import './global-fix.css';
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/design-system.css' // 🎨 Unified Design System
import App from './App.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'

// ULTRA NUCLEAR CACHE BUST - Force browser to recognize new version
console.log('🚀 BDEVidencija v4.0.0 - ULTRA NUCLEAR FORCE UPDATE - 20251007');
console.log('📱 PWA Cache Status: FORCED REFRESH');

// Automatski reload kad se pojavi novi service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    window.location.reload();
  });
}

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
