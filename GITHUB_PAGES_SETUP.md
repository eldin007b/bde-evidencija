# 🔧 GitHub Pages Environment Setup

## Problem
GitHub Pages ne čita .env fajl - trebate dodati environment varijable u GitHub Actions.

## Rješenje

### 1. **Dodajte secrets u GitHub repository:**
1. Idite na: https://github.com/eldin007b/bde-evidencija/settings/secrets/actions
2. Kliknite "New repository secret"
3. Dodajte:
   - Name: `VITE_MAPQUEST_API_KEY`
   - Value: `HFcTXnwL6PW3Snh7rVohjnYopqvPhCL5`

### 2. **Također dodajte ostale potrebne secrets:**
- `VITE_SUPABASE_URL`: `https://dsltpiupbfopyvuiqffg.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: (iz vašeg .env fajla)
- `VITE_GOOGLE_MAPS_API_KEY`: (ako ga imate)

### 3. **Ažurirajte GitHub Actions workflow**
Trebamo modificirati gh-pages-deploy.yml da koristi secrets.

### 4. **Alternative - Hardcoded fallback**
Možemo dodati fallback u env.js za GitHub Pages deployment.

Koji pristup preferirate?