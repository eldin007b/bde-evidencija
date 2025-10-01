#!/bin/bash
# Deploy script za MapQuest proxy

echo "🚀 Deploying MapQuest proxy to Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy the function
echo "📦 Deploying mapquest-proxy function..."
npx supabase functions deploy mapquest-proxy

echo "✅ Deployment completed!"
echo ""
echo "🔗 Your proxy URL will be:"
echo "https://dsltpiupbfopyvuiqffg.functions.supabase.co/mapquest-proxy"
echo ""
echo "📝 Next steps:"
echo "1. Add MAPQUEST_API_KEY to Supabase secrets (if not added)"
echo "2. Test the proxy endpoint"
echo "3. Deploy your main app to hosting (Vercel/Netlify)"