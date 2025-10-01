#!/bin/bash
# Supabase deployment script

echo "🚀 Deploying to Supabase..."

# Build aplikaciju
npm run build

# Deploy Edge Functions
supabase functions deploy mapquest-proxy

# Deploy static hosting (if supported)
# supabase storage upload --bucket-id hosting dist/

echo "✅ Deployment completed!"
echo "🔗 Your app URL: https://dsltpiupbfopyvuiqffg.supabase.co"
echo ""
echo "📝 Next steps:"
echo "1. Set up custom domain (optional)"
echo "2. Test MapQuest proxy functionality"