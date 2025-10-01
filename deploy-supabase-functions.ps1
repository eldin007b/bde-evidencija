# 🚀 Deploy Supabase Edge Functions

# Prerequisites: Install Supabase CLI
# npm install -g supabase

# 1. Login to Supabase
supabase login

# 2. Link to your project
supabase link --project-ref dsltpiupbfopyvuiqffg

# 3. Deploy MapQuest proxy function
supabase functions deploy mapquest-proxy

# 4. Set environment variables in Supabase
supabase secrets set MAPQUEST_API_KEY=HFcTXnwL6PW3Snh7rVohjnYopqvPhCL5

# 5. Test the deployed function
# curl -X POST https://dsltpiupbfopyvuiqffg.functions.supabase.co/mapquest-proxy \
#   -H "Content-Type: application/json" \
#   -d '{"locations":[{"latLng":{"lat":43.8563,"lng":18.4131}},{"latLng":{"lat":43.8476,"lng":18.3564}}],"options":{"routeType":"fastest","unit":"k"}}'

Write-Host "✅ Supabase Edge Functions deployed!"
Write-Host "🔗 MapQuest Proxy URL: https://dsltpiupbfopyvuiqffg.functions.supabase.co/mapquest-proxy"