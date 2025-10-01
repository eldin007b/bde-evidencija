# Quick Deployment Trigger Script
Write-Host "Triggering GitHub Pages deployment..." -ForegroundColor Yellow

# Update version timestamp in package.json to trigger deployment
$packagePath = "package.json"
$package = Get-Content $packagePath | ConvertFrom-Json
$originalVersion = $package.version

# Add timestamp to trigger new build
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$package.version = "$($originalVersion.Split('-')[0])-build$timestamp"

# Save updated package.json
$package | ConvertTo-Json -Depth 10 | Set-Content $packagePath

Write-Host "Updated version to: $($package.version)" -ForegroundColor Green

# Commit and push
git add .
git commit -m "Deploy: Update to version $($package.version)"
git push origin main

Write-Host ""
Write-Host "Deployment triggered! Check:" -ForegroundColor Green
Write-Host "  Actions: https://github.com/eldin007b/bde-evidencija/actions" -ForegroundColor Cyan
Write-Host "  Live App: https://eldin007b.github.io/bde-evidencija/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment usually takes 2-3 minutes..." -ForegroundColor Yellow