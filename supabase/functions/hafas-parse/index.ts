import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Dummy parser, zamijeni regex iz hafasParser.js po potrebi
function parseHafasConnectionHTML(html: string) {
  return { durationMinutes: 54, distanceMeters: 50900, durationText: "54 min", distanceText: "50.9 km" };
}
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
  const { url, html } = await req.json();
  let source = html;
  if (!source && url) {
    const r = await fetch(url, { headers: { "User-Agent": "bde-evidencija-proxy/1.0" } });
    source = await r.text();
  }
  if (!source) return new Response(JSON.stringify({ error: "Provide html or url in body" }), { status: 400 });
  const parsed = parseHafasConnectionHTML(source);
  return new Response(JSON.stringify(parsed), { 
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    } 
  });
});