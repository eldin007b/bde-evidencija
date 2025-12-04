/*
 Simple script to geocode two addresses using Nominatim and compute aerial distance + estimated driving time.
 Usage: node scripts/route-check.js "Start address" "End address"
*/
import fetch from 'node-fetch';

// Local copy of haversine (meters)
function haversineMeters(a, b) {
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

// Local copy of formatDistance (meters -> '101,9 km')
function formatDistance(meters) {
  if (meters === null || meters === undefined) return null;
  if (meters >= 1000) {
    const km = meters / 1000;
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(km) + ' km';
  }
  return `${meters} m`;
}

// Local copy of formatDuration (seconds -> '2h 33min' or '45 min')
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

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=0`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'bde-evidencija-script/1.0 (contact: none)'
    }
  });
  const j = await res.json();
  if (!j || !j[0]) throw new Error('Geocode failed for: ' + address);
  return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/route-check.js "Start address" "End address"');
    process.exit(2);
  }
  const [start, end, proxyUrl] = args;
  console.log('Geocoding...');
  const a = await geocode(start);
  const b = await geocode(end);
  console.log('Start coords:', a);
  console.log('End coords:', b);
  // If proxy URL provided, try to get driving route from MapQuest via proxy
  if (proxyUrl) {
    try {
      console.log('Calling routing proxy:', proxyUrl);
      const requestBody = {
        locations: [
          { latLng: { lat: a.lat, lng: a.lon } },
          { latLng: { lat: b.lat, lng: b.lon } }
        ],
        options: {
          routeType: 'fastest',
          unit: 'k',
          doReverseGeocode: false,
          enhancesNarratives: false,
          avoidTimedConditions: false
        }
      };

      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        throw new Error(`Proxy returned ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();
      const route = data.route;
      if (!route) throw new Error('No route in proxy response');
      const distanceMeters = Math.round(route.distance * 1000);
      const durationSeconds = Math.round(route.time);
      console.log(`MapQuest route => ${formatDuration(durationSeconds)} • ${formatDistance(distanceMeters)}`);
      process.exit(0);
    } catch (err) {
      console.error('Proxy routing failed, falling back to aerial estimate:', err.message || err);
    }
  }

  // Fallback aerial estimate
  const meters = haversineMeters({lat: a.lat, lon: a.lon}, {lat: b.lat, lon: b.lon});
  const km = meters/1000;
  const estSeconds = Math.round((km / 40) * 3600); // avg 40 km/h
  const durationText = formatDuration(estSeconds);
  const distanceText = formatDistance(Math.round(meters));
  console.log(`Estimated (aerial) => ${durationText} • ${distanceText}`);
}

main().catch(err => { console.error(err); process.exit(1); });
