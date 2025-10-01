// env.js - konfiguracija za PWA
// Use Vite's import.meta.env when available. Provide safe fallbacks so this module
// does not throw in the browser when `process` is undefined.

const _env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const _procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};

// keep the previously present hardcoded supabase values as final fallbacks (local dev convenience)
const FALLBACK_SUPABASE_URL = 'https://dsltpiupbfopyvuiqffg.supabase.co';
const FALLBACK_SUPABASE_KEY = '';
const FALLBACK_API_BASE_URL = "https://dsltpiupbfopyvuiqffg.functions.supabase.co";
const ENV = {
  SUPABASE_URL: _env.VITE_SUPABASE_URL || _env.REACT_APP_SUPABASE_URL || _procEnv.REACT_APP_SUPABASE_URL || FALLBACK_SUPABASE_URL,
  SUPABASE_KEY: _env.VITE_SUPABASE_KEY || _env.REACT_APP_SUPABASE_KEY || _procEnv.REACT_APP_SUPABASE_KEY,
  API_BASE_URL: _env.VITE_API_BASE_URL || _env.REACT_APP_API_BASE_URL || _procEnv.REACT_APP_API_BASE_URL || FALLBACK_API_BASE_URL,
  GOOGLE_MAPS_API_KEY: _env.VITE_GOOGLE_MAPS_API_KEY || _env.REACT_APP_GOOGLE_MAPS_API_KEY || _procEnv.REACT_APP_GOOGLE_MAPS_API_KEY || ''
};

// MapQuest API key (default set to provided key for local/dev; override via env vars in production)
ENV.MAPQUEST_API_KEY = _env.VITE_MAPQUEST_API_KEY || _env.REACT_APP_MAPQUEST_API_KEY || _procEnv.REACT_APP_MAPQUEST_API_KEY || 'HFcTXnwL6PW3Snh7rVohjnYopqvPhCL5';

// Debug log for production
if (typeof window !== 'undefined') {
  console.log('🔧 ENV Debug:', {
    hasViteMapQuestKey: !!_env.VITE_MAPQUEST_API_KEY,
    finalMapQuestKey: ENV.MAPQUEST_API_KEY ? `${ENV.MAPQUEST_API_KEY.substring(0, 8)}...` : 'undefined',
    apiBaseUrl: ENV.API_BASE_URL,
    isProduction: !ENV.API_BASE_URL?.includes('localhost')
  });
}

// Optional routing strategy and a single endpoint (voranachb) to normalize routing
ENV.ROUTE_STRATEGY = _env.VITE_ROUTE_STRATEGY || _env.REACT_APP_ROUTE_STRATEGY || _procEnv.REACT_APP_ROUTE_STRATEGY || '';
ENV.VORANACHB_URL = _env.VITE_VORANACHB_URL || _env.REACT_APP_VORANACHB_URL || _procEnv.REACT_APP_VORANACHB_URL || '';

export const API_BASE_URL = ENV.API_BASE_URL;
export default ENV;
