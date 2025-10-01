import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const MAPQUEST_API_KEY = Deno.env.get("MAPQUEST_API_KEY");
const SB_URL = Deno.env.get("SB_URL");
const SB_KEY = Deno.env.get("SB_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  // Check if API key is available
  if (!MAPQUEST_API_KEY) {
    console.error("MAPQUEST_API_KEY environment variable is not set");
    return new Response(JSON.stringify({ 
      error: "MapQuest API key not configured",
      info: { statuscode: 401, messages: ["API key missing"] }
    }), { 
      status: 401,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      } 
    });
  }

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

  console.log("MapQuest proxy request:", {
    hasApiKey: !!MAPQUEST_API_KEY,
    apiKeyLength: MAPQUEST_API_KEY?.length || 0,
    requestBody
  });

  const url = `https://www.mapquestapi.com/directions/v2/route?key=${MAPQUEST_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  
  console.log("MapQuest API response:", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });
  
  const data = await response.json();
  console.log("MapQuest API data:", {
    statusCode: data.info?.statuscode,
    hasRoute: !!data.route,
    messages: data.info?.messages
  });
  
  return new Response(JSON.stringify(data), { 
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    } 
  });
});