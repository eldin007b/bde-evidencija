# 🚀 Deployment Plan - Supabase & MapQuest Online

## Trenutno stanje ✅
- **Lokalno:** Sve radi - MapQuest API, Supabase, hybrid routing
- **Supabase Edge Functions:** Deployane i funkcionalne (mapquest-proxy, vor-proxy, hafas-parse, route-proxy)
- **Build:** Uspješan sa svim environment varijablama
- **GitHub Workflow:** Konfigurisan za deployment

## Što treba napraviti 📋

### 1. Dodaj GitHub Secrets (KRITIČNO)
Idite na: https://github.com/eldin007b/bde-evidencija/settings/secrets/actions

Dodajte ove secrets:
```
VITE_SUPABASE_URL = https://dsltpiupbfopyvuiqffg.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbHRwaXVwYmZvcHl2dWlxZmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5Mjc3MzcsImV4cCI6MjA2NTUwMzczN30.suu_OSbTBSEkM3YMiPDFIAgDnX3bDavcD8BX4ZfYZxw
VITE_MAPQUEST_API_KEY = HFcTXnwL6PW3Snh7rVohjnYopqvPhCL5
VITE_GITHUB_TOKEN = [YOUR_GITHUB_TOKEN_HERE]
VITE_GITHUB_REPO = eldin007b/gls-scraper
VITE_WORKFLOW_FILE = scraper.yml
VITE_ADMIN_USERS = eldin,eldin begic,admin
VITE_APP_NAME = BDEVidencija
VITE_APP_VERSION = 3.0.0
```

### 2. Trigger Deployment
Nakon dodavanja secrets:
```bash
git add .
git commit -m "Update deployment configuration"
git push origin main
```

### 3. Verifikacija
1. **GitHub Actions**: https://github.com/eldin007b/bde-evidencija/actions
2. **Live App**: https://eldin007b.github.io/bde-evidencija/
3. **Test Page**: https://eldin007b.github.io/bde-evidencija/test-online.html

## Kako radi hibridni pristup 🔄

### Lokalno (Development)
- Koristi `.env` file 
- Direct MapQuest API pozivi
- Local Supabase client

### Online (Production)
- GitHub Secrets → Environment varijable
- MapQuest proxy via Supabase Edge Functions
- Fallback na direct API ako proxy ne radi

## Trenutne Supabase Edge Functions 🌐
- `mapquest-proxy` ✅ (ACTIVE, v9)
- `vor-proxy` ✅ (ACTIVE, v9) 
- `hafas-parse` ✅ (ACTIVE, v8)
- `route-proxy` ✅ (ACTIVE, v7)

## Test rezultati 🧪
- **Environment:** ✅ Sve varijable konfigurirane
- **Supabase Connection:** ✅ Radi
- **MapQuest Proxy:** ✅ Sarajevo-Mostar ruta uspješno testirana
- **Production Build:** ✅ 748.87 kB, gzip: 223.68 kB

## Troubleshooting 🔧

### Ako MapQuest ne radi online:
1. Provjeri GitHub Secrets
2. Provjeri GitHub Actions log
3. Provjeri konzolu u browseru
4. Fallback na direct API će se aktivirati automatski

### Ako Supabase ne radi:
1. Provjeri Supabase project status
2. Provjeri API keys u secrets
3. Provjeri CORS postavke

## Sljedeći koraci 🎯
1. **Dodaj secrets** (5 minuta)
2. **Push changes** (1 minuta) 
3. **Čekaj deployment** (2-3 minute)
4. **Testiraj sve funkcionalnosti** (5 minuta)

**Ukupno vrijeme:** ~10-15 minuta za potpunu online verziju!

## Security Notes 🔒
- API keys su sigurni u GitHub Secrets
- Supabase RLS politike su aktivne
- CORS je pravilno konfigurisan
- Personal access token ima minimalne permissions