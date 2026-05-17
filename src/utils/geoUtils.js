/**
 * 🌍 Geo Utilities
 * Geolokacijske utility funkcije
 */

// Haversine distance calculation in kilometers
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Haversine distance calculation in meters
export function haversineMeters(lat1, lon1, lat2, lon2) {
  return haversineKm(lat1, lon1, lat2, lon2) * 1000;
}

// Format distance for display
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

// Check if two coordinates are close enough (within threshold)
export function areCoordinatesClose(lat1, lon1, lat2, lon2, thresholdMeters = 100) {
  const distance = haversineMeters(lat1, lon1, lat2, lon2);
  return distance <= thresholdMeters;
}

// Convert degrees to radians
export function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

// Convert radians to degrees
export function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

// Calculate bearing between two points
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
           Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  
  let brng = toDegrees(Math.atan2(y, x));
  return (brng + 360) % 360; // Normalize to 0-360
}

// Get compass direction from bearing
export function getCompassDirection(bearing) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Validate coordinates
export function isValidCoordinate(lat, lon) {
  return (
    typeof lat === 'number' && typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180 &&
    !isNaN(lat) && !isNaN(lon)
  );
}

// Get bounding box for coordinates with radius
export function getBoundingBox(lat, lon, radiusKm) {
  const latRange = radiusKm / 111; // Roughly 111 km per degree latitude
  const lonRange = radiusKm / (111 * Math.cos(toRadians(lat)));
  
  return {
    north: lat + latRange,
    south: lat - latRange,
    east: lon + lonRange,
    west: lon - lonRange
  };
}

export default {
  haversineKm,
  haversineMeters,
  formatDistance,
  areCoordinatesClose,
  toRadians,
  toDegrees,
  calculateBearing,
  getCompassDirection,
  isValidCoordinate,
  getBoundingBox
};