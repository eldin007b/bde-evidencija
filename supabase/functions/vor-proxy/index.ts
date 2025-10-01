// Primjer: dohvat GitHub tokena iz environmenta
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
const SB_URL = Deno.env.get("SB_URL");
const SB_KEY = Deno.env.get("SB_KEY");

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// VAO API endpoint (Austria route planner)
const VAO_API_URL = "https://route.api.vor.at/route/";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400 });
  }
  // Proslijedi payload direktno VAO API-ju
  const vaoRes = await fetch(VAO_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const vaoJson = await vaoRes.json();
  return new Response(JSON.stringify(vaoJson), { headers: { "Content-Type": "application/json" } });
});
