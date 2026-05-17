// utils/googleMaps.js
// Simplified: use MapQuest only for routing

import { getRouteFromMapQuest } from './mapQuest';

/**
 * Format distance (meters) to human-readable string
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined) return null;
  if (meters >= 1000) {
    const km = meters / 1000;
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(km) + ' km';
  }
  return `${meters} m`;
}

/**
 * Format duration (seconds) to human-readable string
 */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }
  return `${minutes} min`;
}

/**
 * getDrivingRouteInfo - uses MapQuest only
 */
export async function getDrivingRouteInfo(originLat, originLon, destLat, destLon) {
  try {
    const mq = await getRouteFromMapQuest(originLat, originLon, destLat, destLon);
    if (!mq) {
      return { distanceMeters: null, distanceText: null, durationSeconds: null, durationText: null, source: 'none' };
    }
    return { ...mq, source: 'mapquest' };
  } catch (err) {
    console.warn('MapQuest routing failed:', err?.message || err);
    return { distanceMeters: null, distanceText: null, durationSeconds: null, durationText: null, source: 'none', error: err?.message || String(err) };
  }
}
