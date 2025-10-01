# GitHub Secrets Setup - Simple Version
Write-Host "🔧 GitHub Secrets Setup for bde-evidencija" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 Go to: https://github.com/eldin007b/bde-evidencija/settings/secrets/actions" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 Add these secrets:" -ForegroundColor Yellow

# Read values from .env
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
if ($envContent) {
    foreach ($line in $envContent) {
        if ($line -match "^VITE_") {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                $name = $parts[0]
                $value = $parts[1]
                
                Write-Host ""
                Write-Host "Secret Name: $name" -ForegroundColor Cyan
                if ($value.Length -gt 15) {
                    Write-Host "Secret Value: $($value.Substring(0, 15))..." -ForegroundColor White
                } else {
                    Write-Host "Secret Value: $value" -ForegroundColor White
                }
            }
        }
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ After adding secrets, push any change to trigger deployment:" -ForegroundColor Green
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m ""Trigger deployment""" -ForegroundColor Cyan
Write-Host "   git push origin main" -ForegroundColor Cyan