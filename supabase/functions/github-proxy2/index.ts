import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // TEST: Vrati vrednost GITHUB_TOKEN iz okruženja (NE OSTAVLJAJ NA PRODUKCIJI!)
  const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
  return new Response(JSON.stringify({ token: GITHUB_TOKEN }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    status: 200
  });
});
