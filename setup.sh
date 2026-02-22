#!/usr/bin/env bash
# Quick setup for MassageMatch Thailand (Cursor / local dev)
set -e

echo "MassageMatch Thailand – setup"
echo ""

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example. Edit .env with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  else
    echo "No .env.example found. Create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  fi
else
  echo ".env already exists."
fi

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "To generate VAPID keys for push notifications (optional):"
echo "  npx web-push generate-vapid-keys"
echo "  Add public key to .env as VITE_VAPID_PUBLIC_KEY"
echo "  Add private key to Supabase Edge Function secrets as VAPID_PRIVATE_KEY (and public as VAPID_PUBLIC_KEY)"
echo ""
echo "Run migrations 1–20 in Supabase SQL Editor (see README.md)."
echo "Deploy Edge Functions (create-checkout, stripe-webhook, notify-push, etc.)."
echo ""
echo "Start dev server:"
echo "  npm run dev"
echo ""
echo "Build:"
echo "  npm run build"
echo ""
echo "Testing: see TESTING_CHECKLIST.md"
