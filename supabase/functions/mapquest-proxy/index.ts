import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const MAPQUEST_API_KEY = Deno.env.get("MAPQUEST_API_KEY");
const SB_URL = Deno.env.get("SB_URL");
const SB_KEY = Deno.env.get("SB_KEY");

serve(async (req) => {
  let requestBody;
  let useJsonBody = false;
  try {
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const bodyText = await req.text();
        if (bodyText) {
          const parsed = JSON.parse(bodyText);
          if (parsed.locations && Array.isArray(parsed.locations)) {
            // Pravi proxy: koristi payload iz frontenda
            requestBody = parsed;
            useJsonBody = true;
          }
        }
      }
    }
  } catch (err) {
    // fallback na URL parametre
    requestBody = undefined;
  }

  if (!useJsonBody) {
    // Fallback na URL parametre
    const { searchParams } = new URL(req.url);
    const originLat = searchParams.get("originLat");
    const originLon = searchParams.get("originLon");
    const destLat = searchParams.get("destLat");
    const destLon = searchParams.get("destLon");
    if (!originLat || !originLon || !destLat || !destLon) {
      return new Response(JSON.stringify({ error: "Missing coordinates" }), { status: 400 });
    }
    requestBody = {
      locations: [
        { latLng: { lat: Number(originLat), lng: Number(originLon) } },
        { latLng: { lat: Number(destLat), lng: Number(destLon) } }
      ],
      options: { routeType: "fastest", unit: "k" }
    };
  }

  const url = `https://www.mapquestapi.com/directions/v2/route?key=${MAPQUEST_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  const data = await response.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
});