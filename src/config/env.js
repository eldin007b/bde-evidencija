// env.js - konfiguracija za PWA
// Use Vite's import.meta.env when available. Provide safe fallbacks so this module
// does not throw in the browser when `process` is undefined.

const _env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const _procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};

// keep the previously present hardcoded supabase values as final fallbacks (local dev convenience)
const FALLBACK_SUPABASE_URL = 'https://dsltpiupbfopyvuiqffg.supabase.co';
const FALLBACK_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbHRwaXVwYmZvcHl2dWlxZmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5Mjc3MzcsImV4cCI6MjA2NTUwMzczN30.suu_OSbTBSEkM3YMiPDFIAgDnX3bDavcD8BX4ZfYZxw';
const FALLBACK_API_BASE_URL = "https://dsltpiupbfopyvuiqffg.supabase.co/functions/v1";
const ENV = {
  SUPABASE_URL: _env.VITE_SUPABASE_URL || _env.REACT_APP_SUPABASE_URL || _procEnv.REACT_APP_SUPABASE_URL || FALLBACK_SUPABASE_URL,
  SUPABASE_KEY: _env.VITE_SUPABASE_ANON_KEY || _env.VITE_SUPABASE_KEY || _env.REACT_APP_SUPABASE_KEY || _procEnv.REACT_APP_SUPABASE_KEY || FALLBACK_SUPABASE_KEY,
  API_BASE_URL: _env.VITE_API_BASE_URL || _env.REACT_APP_API_BASE_URL || _procEnv.REACT_APP_API_BASE_URL || FALLBACK_API_BASE_URL,
  GOOGLE_MAPS_API_KEY: _env.VITE_GOOGLE_MAPS_API_KEY || _env.REACT_APP_GOOGLE_MAPS_API_KEY || _procEnv.REACT_APP_GOOGLE_MAPS_API_KEY || ''
};

// MapQuest API key (default set to provided key for local/dev; override via env vars in production)
ENV.MAPQUEST_API_KEY = _env.VITE_MAPQUEST_API_KEY || _env.REACT_APP_MAPQUEST_API_KEY || _procEnv.REACT_APP_MAPQUEST_API_KEY || 'HFcTXnwL6PW3Snh7rVohjnYopqvPhCL5';

// GitHub configuration for admin dashboard
ENV.GITHUB_TOKEN = _env.VITE_GITHUB_TOKEN || _env.REACT_APP_GITHUB_TOKEN || _procEnv.REACT_APP_GITHUB_TOKEN || ''; // Read from environment
ENV.GITHUB_REPO = _env.VITE_GITHUB_REPO || _env.REACT_APP_GITHUB_REPO || _procEnv.REACT_APP_GITHUB_REPO || 'eldin007b/gls-scraper';
ENV.WORKFLOW_FILE = _env.VITE_WORKFLOW_FILE || _env.REACT_APP_WORKFLOW_FILE || _procEnv.REACT_APP_WORKFLOW_FILE || 'scraper.yml';

// Debug GitHub config (only show if token exists) - REMOVED FOR PRODUCTION

// Optional routing strategy and a single endpoint (voranachb) to normalize routing

// Optional routing strategy and a single endpoint (voranachb) to normalize routing
ENV.ROUTE_STRATEGY = _env.VITE_ROUTE_STRATEGY || _env.REACT_APP_ROUTE_STRATEGY || _procEnv.REACT_APP_ROUTE_STRATEGY || '';
ENV.VORANACHB_URL = _env.VITE_VORANACHB_URL || _env.REACT_APP_VORANACHB_URL || _procEnv.REACT_APP_VORANACHB_URL || '';

export const API_BASE_URL = ENV.API_BASE_URL;
export default ENV;
