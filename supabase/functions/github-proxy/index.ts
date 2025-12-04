import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ProxyRequest {
  method?: string;
  path: string;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
}

serve(async (req: Request) => {
  try {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
    };

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Read GITHUB token from env (must be set as a Secret)
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN not found in environment");
      return new Response(JSON.stringify({ code: 500, message: "Server misconfiguration: missing GITHUB_TOKEN" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Accept only POST for proxying (safer)
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ message: "Only POST allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", "Allow": "POST", ...corsHeaders },
      });
    }

    const payload: ProxyRequest = await req.json().catch(() => null);
    if (!payload || typeof payload.path !== "string") {
      return new Response(JSON.stringify({ message: "Invalid request payload. Expect JSON with 'path' field." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Basic validation: prevent open redirect/host header overwrite
    if (!payload.path.startsWith("/")) {
      return new Response(JSON.stringify({ message: "Invalid path. Must start with '/'" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build GitHub URL
    const base = "https://api.github.com";
    const url = new URL(base + payload.path);
    if (payload.query) {
      Object.entries(payload.query).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    // Prepare fetch options
    const headers = new Headers({
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "supabase-edge-function-github-proxy",
    });

    // Merge any allowed custom headers (CAUTION: do not allow overriding Authorization)
    if (payload.headers) {
      for (const [k, v] of Object.entries(payload.headers)) {
        const key = k.toLowerCase();
        if (key === "authorization" || key === "host") continue;
        headers.set(k, v);
      }
    }

    const fetchOptions: RequestInit = {
      method: payload.method?.toUpperCase() ?? "GET",
      headers,
    };

    if (payload.body != null && fetchOptions.method !== "GET" && fetchOptions.method !== "HEAD") {
      // If body is an object, send as JSON
      if (typeof payload.body === "object") {
        headers.set("Content-Type", "application/json");
        fetchOptions.body = JSON.stringify(payload.body);
        console.log(`Setting JSON body: ${JSON.stringify(payload.body)}`);
      } else {
        // allow raw string bodies
        fetchOptions.body = String(payload.body);
        console.log(`Setting string body: ${payload.body}`);
      }
    } else {
      console.log("No body to set");
    }

    // Execute request to GitHub
    console.log(`Making request to: ${url.toString()}`);
    console.log(`Method: ${fetchOptions.method}`);
    console.log(`Body: ${fetchOptions.body || 'null'}`);
    
    const ghResp = await fetch(url.toString(), fetchOptions);
    
    console.log(`GitHub response status: ${ghResp.status}`);
    console.log(`GitHub response headers:`, Object.fromEntries(ghResp.headers.entries()));

    // Proxy response status, headers (filtering unsafe ones), and body
    const respHeaders = new Headers(corsHeaders);
    // Only forward safe headers
    const safeHeaders = ["content-type", "content-length", "cache-control", "etag", "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"];
    ghResp.headers.forEach((val, key) => {
      if (safeHeaders.includes(key.toLowerCase())) respHeaders.set(key, val);
    });

    // Handle empty response body for 204 No Content (workflow dispatch)
    let respBody = null;
    if (ghResp.status !== 204) {
      respBody = await ghResp.text();
    }
    
    console.log(`Response body length: ${respBody ? respBody.length : 0}`);

    return new Response(respBody, {
      status: ghResp.status,
      headers: respHeaders,
    });

  } catch (err) {
    console.error("github-proxy error:", err);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
