# Supabase Edge Function: github-proxy

Ova funkcija omogućava sigurni proxy ka GitHub API-ju bez izlaganja tokena u browseru.

## Korišćenje

1. **Dodaj GITHUB_TOKEN kao secret u Supabase dashboardu**
2. Deploy funkciju:
   ```
npx supabase functions deploy github-proxy
```
3. Poziv iz frontenda:
   ```js
   await fetch('https://<tvoj-projekt>.functions.supabase.co/github-proxy', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       endpoint: 'repos/eldin007b/gls-scraper/actions/runs?per_page=20',
       method: 'GET'
     })
   });
   ```

## Napomena
- Token NIKAD ne ide u browser!
- Možeš koristiti za sve GitHub API pozive (GET, POST, ...)
