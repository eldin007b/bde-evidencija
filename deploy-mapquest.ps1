# Deploy script za MapQuest proxy (PowerShell)

Write-Host "🚀 Deploying MapQuest proxy to Supabase..." -ForegroundColor Green

# Check if supabase CLI is installed
if (!(Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI is not installed. Install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Deploy the function
Write-Host "📦 Deploying mapquest-proxy function..." -ForegroundColor Blue
npx supabase functions deploy mapquest-proxy

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Your proxy URL will be:" -ForegroundColor Cyan
Write-Host "https://dsltpiupbfopyvuiqffg.functions.supabase.co/mapquest-proxy" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Magenta
Write-Host "1. Add MAPQUEST_API_KEY to Supabase secrets (if not added)"
Write-Host "2. Test the proxy endpoint"  
Write-Host "3. Deploy your main app to hosting (Vercel/Netlify)"