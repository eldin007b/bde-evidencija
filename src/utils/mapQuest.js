// utils/mapQuest.js
import ENV from '../config/env';

/**
 * Get driving route info from MapQuest Directions API
 * Returns data in same format as Google Directions API for consistency
 */
export async function getRouteFromMapQuest(originLat, originLon, destLat, destLon) {
  const apiKey = ENV.MAPQUEST_API_KEY;
  
  if (!apiKey || apiKey === 'your_mapquest_key_here') {
    throw new Error('MapQuest API key not configured');
  }

  try {
    const url = `https://www.mapquestapi.com/directions/v2/route?key=${encodeURIComponent(apiKey)}`;
    
    const requestBody = {
      locations: [
        { latLng: { lat: originLat, lng: originLon } },
        { latLng: { lat: destLat, lng: destLon } }
      ],
      options: {
        routeType: 'fastest',
        unit: 'k', // kilometers
        doReverseGeocode: false,
        enhancesNarratives: false,
        avoidTimedConditions: false
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`MapQuest API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.info.statuscode !== 0) {
      const errorMessages = {
        400: 'Bad request',
        401: 'Unauthorized - check API key',
        403: 'Forbidden',
        500: 'MapQuest server error'
      };
      throw new Error(`MapQuest API error ${data.info.statuscode}: ${errorMessages[data.info.statuscode] || data.info.messages?.join(', ') || 'Unknown error'}`);
    }

    const route = data.route;
    
    if (!route) {
      throw new Error('No route data received from MapQuest');
    }

  // Format data to match Google Directions API structure
  // Note: MapQuest `route.distance` is in kilometers (when unit='k') and
  // `route.time` is returned in seconds. Do not multiply by 60.
  const distanceMeters = Math.round(route.distance * 1000); // km to meters
  const durationSeconds = Math.round(route.time); // already seconds

    return {
      distanceMeters,
      distanceText: formatDistance(distanceMeters),
      durationSeconds,
      durationText: formatDuration(durationSeconds),
      // Additional MapQuest specific data if needed
      mapQuestData: {
        fuelUsed: route.fuelUsed,
        realTime: route.hasRealTime,
        sessionId: route.sessionId
      }
    };

  } catch (error) {
    console.warn('MapQuest routing failed:', error.message);
    throw error; // Re-throw to allow fallback to other services
  }
}

/**
 * Format distance (meters) to human-readable string
 */
function formatDistance(meters) {
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
function formatDuration(seconds) {
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
 * Alternative: Get route with addresses instead of coordinates
 */
export async function getRouteFromAddresses(startAddress, endAddress) {
  const apiKey = ENV.MAPQUEST_API_KEY;
  
  if (!apiKey) {
    throw new Error('MapQuest API key not configured');
  }

  try {
    const url = `https://www.mapquestapi.com/directions/v2/route?key=${encodeURIComponent(apiKey)}&from=${encodeURIComponent(startAddress)}&to=${encodeURIComponent(endAddress)}&unit=k`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MapQuest API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.info.statuscode !== 0) {
      throw new Error(`MapQuest API error: ${data.info.messages?.join(', ') || 'Unknown error'}`);
    }

    const route = data.route;
  const distanceMeters = Math.round(route.distance * 1000);
  const durationSeconds = Math.round(route.time);

    return {
      distanceMeters,
      distanceText: formatDistance(distanceMeters),
      durationSeconds,
      durationText: formatDuration(durationSeconds)
    };

  } catch (error) {
    console.warn('MapQuest address routing failed:', error.message);
    throw error;
  }
}
