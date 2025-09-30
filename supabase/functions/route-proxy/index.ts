import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 1000);
}
serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let origin, dest;
  let parsed = false;
  try {
    const body = await req.json();
    if (body.origin && body.dest) {
      origin = body.origin;
      dest = body.dest;
      parsed = true;
    }
  } catch (err) {
    // fallback na URL parametre
  }
  if (!parsed) {
    // Fallback na URL parametre
    const { searchParams } = new URL(req.url);
    const originLat = searchParams.get("originLat");
    const originLon = searchParams.get("originLon");
    const destLat = searchParams.get("destLat");
    const destLon = searchParams.get("destLon");
    if (originLat && originLon && destLat && destLon) {
      origin = { lat: Number(originLat), lon: Number(originLon) };
      dest = { lat: Number(destLat), lon: Number(destLon) };
    }
  }
  if (origin && dest && origin.lat && origin.lon && dest.lat && dest.lon) {
    const meters = haversineMeters(origin.lat, origin.lon, dest.lat, dest.lon);
    const durationSeconds = Math.round((meters/1000) / 50 * 3600);
    return new Response(JSON.stringify({
      distanceMeters: meters,
      durationSeconds,
      distanceText: (meters>=1000?`${(meters/1000).toFixed(1)} km`:`${meters} m`),
      durationText: `${Math.round(durationSeconds/60)} min`,
      provider: "VORANACHB-MOCK"
    }), { headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ error: "origin and dest required" }), { status: 400 });
});