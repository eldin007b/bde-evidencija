## Sigurna upotreba API ključeva i tajni

### 1. Supabase Functions
Sve tajne (API ključevi, tokeni) dodaj u Supabase Dashboard → Settings → Environment Variables (Secrets).

U kodu koristi:
```typescript
const MAPQUEST_API_KEY = Deno.env.get("MAPQUEST_API_KEY");
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
```

### 2. Frontend (.env)
Za lokalni razvoj koristi `.env` fajl (koji je u `.gitignore`):
```
VITE_MAPQUEST_API_KEY=ovdje_tvoj_kljuc
VITE_SUPABASE_KEY=ovdje_tvoj_kljuc
```
U kodu koristi:
```javascript
const apiKey = import.meta.env.VITE_MAPQUEST_API_KEY;
```

### 3. GitHub Actions
Sve tajne dodaj u repo Settings → Secrets and variables → Actions.
U workflow fajlu koristi `${{ secrets.GITHUB_TOKEN }}`.

---
**Napomena:** Nikad ne hardkodiraj ključeve u kodu! Rotiraj ih redovno i koristi environment varijable.