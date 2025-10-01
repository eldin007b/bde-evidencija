import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// VAO API endpoint (Austria route planner)
const VAO_API_URL = "https://anachb.vor.at/bin/mgate.exe";

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

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400 });
  }
  // Proslijedi payload direktno VAO API-ju
  try {
    const vaoRes = await fetch(VAO_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!vaoRes.ok) {
      return new Response(JSON.stringify({ 
        error: `VAO API returned ${vaoRes.status}`,
        status: vaoRes.status,
        statusText: vaoRes.statusText 
      }), { 
        status: 502,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        } 
      });
    }
    
    const vaoJson = await vaoRes.json();
    return new Response(JSON.stringify(vaoJson), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: "Failed to connect to VAO API",
      details: error.message 
    }), { 
      status: 502,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      } 
    });
  }
});
