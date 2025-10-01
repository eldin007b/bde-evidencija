# Test Supabase Edge Functions
Write-Host "Testing Supabase Edge Functions..." -ForegroundColor Yellow
Write-Host ""

# Test MapQuest proxy
Write-Host "1. Testing MapQuest Proxy..." -ForegroundColor Cyan
try {
    $body = @{
        locations = @(
            @{ latLng = @{ lat = 43.8563; lng = 18.4131 } },  # Sarajevo
            @{ latLng = @{ lat = 43.3209; lng = 17.8081 } }   # Mostar
        )
        options = @{
            routeType = "fastest"
            unit = "k"
        }
    } | ConvertTo-Json -Depth 5

    $response = Invoke-RestMethod -Uri "https://dsltpiupbfopyvuiqffg.functions.supabase.co/mapquest-proxy" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.route) {
        Write-Host "   ✅ MapQuest Proxy: OK" -ForegroundColor Green
        Write-Host "   Distance: $($response.route.distance) km" -ForegroundColor White
        Write-Host "   Time: $([math]::Round($response.route.time / 60)) minutes" -ForegroundColor White
    } else {
        Write-Host "   ❌ MapQuest Proxy: Invalid response" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ MapQuest Proxy: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test VOR proxy
Write-Host "2. Testing VOR Proxy..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://dsltpiupbfopyvuiqffg.functions.supabase.co/vor-proxy?route=test" -Method GET
    Write-Host "   ✅ VOR Proxy: Accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ VOR Proxy: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test HAFAS parse
Write-Host "3. Testing HAFAS Parse..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://dsltpiupbfopyvuiqffg.functions.supabase.co/hafas-parse" -Method GET
    Write-Host "   ✅ HAFAS Parse: Accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ HAFAS Parse: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Route proxy
Write-Host "4. Testing Route Proxy..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://dsltpiupbfopyvuiqffg.functions.supabase.co/route-proxy" -Method GET
    Write-Host "   ✅ Route Proxy: Accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Route Proxy: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Edge Functions test completed!" -ForegroundColor Yellow