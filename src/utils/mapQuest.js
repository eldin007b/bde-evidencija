// utils/mapQuest.js
import ENV from '../config/env';

/**
 * Format MapQuest response to consistent format
 */
function formatMapQuestResponse(data) {
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
}

/**
 * Get driving route info from MapQuest Directions API
 * Uses direct API locally, Supabase proxy in production (hybrid approach)
 * Returns data in same format as Google Directions API for consistency
 */
export async function getRouteFromMapQuest(originLat, originLon, destLat, destLon) {
  // Smart hybrid approach with automatic fallback
  return await getRouteWithFallback(originLat, originLon, destLat, destLon);
}

/**
 * Smart routing with Supabase proxy preference
 */
async function getRouteWithFallback(originLat, originLon, destLat, destLon) {
  // First try: MAPQUEST_PROXY_URL if configured (preferred for production)
  if (ENV.MAPQUEST_PROXY_URL) {
    try {
      return await getRouteViaSupabaseProxy(originLat, originLon, destLat, destLon);
    } catch (proxyError) {
      // Proxy failed, trying direct API fallback
    }
  }
  
  // Second try: Direct API (fallback)
  try {
    return await getRouteDirectAPI(originLat, originLon, destLat, destLon);
  } catch (directError) {
    throw new Error(`Both MapQuest methods failed. Proxy: ${proxyError?.message || 'not available'}, Direct: ${directError.message}`);
  }
}

/**
 * Get route via Supabase Edge Function proxy (for production)
 */
async function getRouteViaSupabaseProxy(originLat, originLon, destLat, destLon) {
  try {
    const requestBody = {
      locations: [
        { latLng: { lat: originLat, lng: originLon } },
        { latLng: { lat: destLat, lng: destLon } }
      ],
      options: {
        routeType: 'fastest',
        unit: 'k',
        doReverseGeocode: false,
        enhancesNarratives: false,
        avoidTimedConditions: false
      }
    };

    const proxyEndpoint = ENV.MAPQUEST_PROXY_URL || `${ENV.API_BASE_URL}/mapquest-proxy`;
    const response = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`MapQuest proxy error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return formatMapQuestResponse(data);

  } catch (error) {
    throw error;
  }
}

/**
 * Get route directly from MapQuest API (for development)
 */
async function getRouteDirectAPI(originLat, originLon, destLat, destLon) {
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
      throw new Error(`MapQuest API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return formatMapQuestResponse(data);

  } catch (error) {
    throw error;
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
 * Also uses hybrid approach
 */
export async function getRouteFromAddresses(startAddress, endAddress) {
  // For address-based routing, we'll use direct API for simplicity
  // (Could be extended to support proxy as well)
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
    return formatMapQuestResponse(data);

  } catch (error) {
    throw error;
  }
}
