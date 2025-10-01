# GitHub Secrets Setup Script
# Run this to add all required secrets for deployment

# Get GitHub token from .env file
$envFile = Get-Content ".env"
$githubToken = ($envFile | Where-Object { $_ -match "VITE_GITHUB_TOKEN=" }) -replace "VITE_GITHUB_TOKEN=", ""
$supabaseUrl = ($envFile | Where-Object { $_ -match "VITE_SUPABASE_URL=" }) -replace "VITE_SUPABASE_URL=", ""
$supabaseKey = ($envFile | Where-Object { $_ -match "VITE_SUPABASE_ANON_KEY=" }) -replace "VITE_SUPABASE_ANON_KEY=", ""
$mapquestKey = ($envFile | Where-Object { $_ -match "VITE_MAPQUEST_API_KEY=" }) -replace "VITE_MAPQUEST_API_KEY=", ""
$githubRepo = ($envFile | Where-Object { $_ -match "VITE_GITHUB_REPO=" }) -replace "VITE_GITHUB_REPO=", ""
$workflowFile = ($envFile | Where-Object { $_ -match "VITE_WORKFLOW_FILE=" }) -replace "VITE_WORKFLOW_FILE=", ""

$repoOwner = "eldin007b"
$repoName = "bde-evidencija"

Write-Host "🔧 Setting up GitHub Secrets for $repoOwner/$repoName..." -ForegroundColor Yellow

# Function to add a secret
function Add-GitHubSecret {
    param(
        [string]$secretName,
        [string]$secretValue,
        [string]$token,
        [string]$owner,
        [string]$repo
    )
    
    if ([string]::IsNullOrEmpty($secretValue)) {
        Write-Host "⚠️  Skipping $secretName - no value provided" -ForegroundColor Yellow
        return
    }
    
    # For simplicity, we'll just show the command to run manually
    Write-Host "📝 To add secret '$secretName':" -ForegroundColor Green
    Write-Host "   Go to: https://github.com/$owner/$repo/settings/secrets/actions" -ForegroundColor Cyan
    Write-Host "   Name: $secretName" -ForegroundColor Cyan
    if ($secretValue.Length -gt 10) {
        Write-Host "   Value: $($secretValue.Substring(0, 10))..." -ForegroundColor Cyan
    } else {
        Write-Host "   Value: $secretValue" -ForegroundColor Cyan
    }
    Write-Host ""
}

Write-Host "🚀 GitHub Secrets to add:" -ForegroundColor Green
Write-Host ""

# Add all secrets
Add-GitHubSecret -secretName "VITE_SUPABASE_URL" -secretValue $supabaseUrl -token $githubToken -owner $repoOwner -repo $repoName
Add-GitHubSecret -secretName "VITE_SUPABASE_ANON_KEY" -secretValue $supabaseKey -token $githubToken -owner $repoOwner -repo $repoName
Add-GitHubSecret -secretName "VITE_MAPQUEST_API_KEY" -secretValue $mapquestKey -token $githubToken -owner $repoOwner -repo $repoName
Add-GitHubSecret -secretName "VITE_GITHUB_TOKEN" -secretValue $githubToken -token $githubToken -owner $repoOwner -repo $repoName
Add-GitHubSecret -secretName "VITE_GITHUB_REPO" -secretValue $githubRepo -token $githubToken -owner $repoOwner -repo $repoName
Add-GitHubSecret -secretName "VITE_WORKFLOW_FILE" -secretValue $workflowFile -token $githubToken -owner $repoOwner -repo $repoName

Write-Host "✅ Script completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Manual steps:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/$repoOwner/$repoName/settings/secrets/actions" -ForegroundColor Cyan
Write-Host "2. Add each secret listed above with the provided values" -ForegroundColor Cyan
Write-Host "3. Run 'git push' to trigger a new deployment" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 To verify deployment:" -ForegroundColor Yellow
Write-Host "   Check: https://github.com/$repoOwner/$repoName/actions" -ForegroundColor Cyan
Write-Host "   Visit: https://$repoOwner.github.io/$repoName/" -ForegroundColor Cyan