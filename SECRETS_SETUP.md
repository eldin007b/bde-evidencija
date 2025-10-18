# 🔑 GitHub Secrets - Quick Setup

## Copy ove vrednosti direktno u GitHub Secrets:

### VITE_VAPID_PUBLIC_KEY
```
BLeZWVsLWNC_Y-lzWnsrZQXIjCTxtPXHPSlDB4v6As_QyKzguPKE7AwxCb3h4PCEG9JaHhw0dgS3VhXCKohTyqE
```

### VITE_PUSH_API_URL  
```
https://dsltpiupbfopyvuiqffg.supabase.co/functions/v1/auto-push
```

### VITE_APP_VERSION
```
5.0.0
```

### VITE_APP_NAME
```
BD Evidencija
```

### VITE_GITHUB_TOKEN
```
[KOPIRAJTE VAS TOKEN IZ .env.local FAJLA]
```

## 📋 Instrukcije:
1. Idite na GitHub: https://github.com/[YOUR_USERNAME]/[YOUR_REPO]/settings/secrets/actions
2. Kliknite "New repository secret"
3. Copy-paste Name i Value za svaki secret
4. Kliknite "Add secret"

**⚠️ POMEMBNO: Bez ovih secrets, push notifikacije neće raditi u production deployment!**