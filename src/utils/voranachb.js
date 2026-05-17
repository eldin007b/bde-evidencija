// voranachb.js
// Simple client to call a single-normalizer endpoint (voranachb) that accepts
// an origin/destination and returns { distanceMeters, durationSeconds, distanceText, durationText }
import ENV from '../config/env';

const DEFAULT_TIMEOUT = 8000;

async function postJson(url, body, timeout = DEFAULT_TIMEOUT) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const id = controller ? setTimeout(() => controller.abort(), timeout) : null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } finally {
    if (id) clearTimeout(id);
  }
}

// Expects origin { lat, lon } and dest { lat, lon }
export async function fetchVoranachbRoute(origin, dest) {
  // Use Supabase route-proxy instead of external VORANACHB_URL
  const url = `${ENV.API_BASE_URL}/route-proxy`;

  // payload tolerant: if origin/dest are strings (addresses) send them as address fields
  const payload = {};
  if (origin && typeof origin === 'object') payload.origin = (('lat' in origin && 'lon' in origin) ? { lat: origin.lat, lon: origin.lon } : origin);
  else if (origin) payload.origin = { address: String(origin) };
  if (dest && typeof dest === 'object') payload.dest = (('lat' in dest && 'lon' in dest) ? { lat: dest.lat, lon: dest.lon } : dest);
  else if (dest) payload.dest = { address: String(dest) };

  const json = await postJson(url, payload);
  // Normalize response (tolerant)
  return {
    distanceMeters: json.distanceMeters || json.distance || null,
    durationSeconds: json.durationSeconds || json.duration || null,
    distanceText: json.distanceText || (json.distance ? `${(json.distance/1000).toFixed(1)} km` : null),
    durationText: json.durationText || (json.duration ? `${Math.round(json.duration/60)} min` : null),
    provider: json.provider || 'ROUTE-PROXY'
  };
}

export default { fetchVoranachbRoute };
