# Test script za MapQuest hibridni pristup

Write-Host "🧪 Testing MapQuest hybrid approach..." -ForegroundColor Green

# Test lokalno (development)
Write-Host "`n📍 Testing locally (should use direct API)..." -ForegroundColor Blue
Write-Host "Check browser console for: '🔧 Using MapQuest direct API (development)'"

# Test URL za produkciju
Write-Host "`n🌐 Production proxy URL will be:" -ForegroundColor Cyan  
Write-Host "https://dsltpiupbfopyvuiqffg.functions.supabase.co/mapquest-proxy"

# Test curl command za proxy
Write-Host "`n📡 Test proxy with curl:" -ForegroundColor Yellow
$testJson = @"
{
  "locations": [
    {"latLng": {"lat": 43.8563, "lng": 18.4131}},
    {"latLng": {"lat": 43.8476, "lng": 18.3564}}
  ],
  "options": {"routeType": "fastest", "unit": "k"}
}
"@

Write-Host "curl -X POST -H 'Content-Type: application/json' -d '$testJson' https://dsltpiupbfopyvuiqffg.functions.supabase.co/mapquest-proxy"

Write-Host "`n✅ Hybrid approach implemented!" -ForegroundColor Green
Write-Host "🏠 Local: Direct API" 
Write-Host "🌐 Production: Supabase Proxy"