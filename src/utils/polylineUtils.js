// utils/polylineUtils.js
import { formatDistance as gmFormatDistance, formatDuration as gmFormatDuration } from './googleMaps';

// Parse polyline string like "lat,lon;lat,lon;..." into [{lat,lon}, ...]
export function parsePolylineString(polyline) {
  if (!polyline || typeof polyline !== 'string') return [];
  return polyline.split(';').map(seg => {
    const parts = seg.split(',').map(s => s.trim());
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon)) return null;
    return { lat, lon };
  }).filter(Boolean);
}

// Haversine distance in meters between two points
export function haversineMeters(a, b) {
  if (!a || !b) return 0;
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat/2);
  const sinDLon = Math.sin(dLon/2);
  const aVal = sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLon*sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}

// Total distance of polyline points in meters
export function totalDistanceMeters(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i-1], points[i]);
  }
  return Math.round(total);
}

// Estimate duration in seconds from distance meters and average speed km/h
export function estimateDurationSeconds(distanceMeters, avgSpeedKmh = 80) {
  if (!distanceMeters || isNaN(distanceMeters) || avgSpeedKmh <= 0) return null;
  const hours = (distanceMeters / 1000) / avgSpeedKmh;
  return Math.round(hours * 3600);
}

// Format compact string: "31 min(43,9 km)" using shared formatters
export function formatCompactRoute(distanceMeters, durationSeconds) {
  const distText = distanceMeters ? gmFormatDistance(distanceMeters) : '--';
  const durText = durationSeconds ? gmFormatDuration(durationSeconds) : '--';
  return `${durText}(${distText})`;
}

// Convenience: parse polyline string and return { distanceMeters, durationSeconds, compact }
export function analyzePolyline(polylineString, avgSpeedKmh = 100) {
  const points = parsePolylineString(polylineString);
  const distanceMeters = totalDistanceMeters(points);
  const durationSeconds = estimateDurationSeconds(distanceMeters, avgSpeedKmh);
  const compact = formatCompactRoute(distanceMeters, durationSeconds);
  return { points, distanceMeters, durationSeconds, compact };
}

export default { parsePolylineString, haversineMeters, totalDistanceMeters, estimateDurationSeconds, formatCompactRoute, analyzePolyline };
