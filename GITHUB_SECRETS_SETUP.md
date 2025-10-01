# GitHub Secrets Setup for BDE Evidencija

## Required Secrets for GitHub Pages:

1. **VITE_GITHUB_TOKEN**: `ghp_***[CONTACT_ADMIN_FOR_TOKEN]***`
   - Used for triggering GLS Scraper workflows
   - Needs `repo` and `workflow` permissions

2. **VITE_SUPABASE_URL**: `https://dsltpiupbfopyvuiqffg.supabase.co`
   - Supabase project URL

3. **VITE_SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Supabase anonymous key (contact admin for full key)

4. **VITE_MAPQUEST_API_KEY**: `HFcTXnwL6PW3Snh7rVohjnYopqvPhCL5`
   - MapQuest API key for routing

## Setup Instructions:

1. Go to: https://github.com/eldin007b/bde-evidencija/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret with exact name and value
4. Rebuild GitHub Pages to use new secrets

## Verification:

After setup, admin panel should show:
✅ GitHub funkcionalnost je aktivna (Token: ghp_***...)

## Current Status:
- ✅ Local development: Working with new token
- ⏳ GitHub Pages: Needs secrets setup
- ✅ GLS Scraper integration: 115+ workflows detected