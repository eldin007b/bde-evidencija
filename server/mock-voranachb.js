#!/usr/bin/env node
// mock-voranachb.js - simple local server to emulate a single route-normalizer endpoint
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 1000);
}

app.post('/route', (req, res) => {
  const { origin, dest } = req.body || {};
  // Accept either coords or addresses. If addresses given without coords, return a fixed mock.
  if (!origin || !dest) return res.status(400).json({ error: 'origin and dest required' });

  if (origin.lat && origin.lon && dest.lat && dest.lon) {
    const meters = haversineMeters(origin.lat, origin.lon, dest.lat, dest.lon);
    const secs = Math.round((meters/1000) / 60 * 60 * (3600/60) * (1/50) * 3600); // rough fallback (ignored complex math)
    // better: assume avg speed 60 km/h
    const secs2 = Math.round((meters/1000) / 60 * 3600 / (60/60));
    const durationSeconds = Math.round((meters/1000) / 50 * 3600);
    return res.json({ distanceMeters: meters, durationSeconds, distanceText: (meters>=1000?`${(meters/1000).toFixed(1)} km`:`${meters} m`), durationText: `${Math.round(durationSeconds/60)} min`, provider: 'VORANACHB-MOCK' });
  }

  // fallback when no coords: return example values
  return res.json({ distanceMeters: 50900, durationSeconds: 3240, distanceText: '50.9 km', durationText: '54 min', provider: 'VORANACHB-MOCK' });
});

const port = process.env.PORT || 4001;
app.listen(port, () => console.log(`Mock voranachb listening on http://localhost:${port}`));
