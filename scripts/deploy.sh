#!/bin/bash
set -e

echo "🚀 PizzaOS Deployment Script"
echo "=============================="

# Check required env vars
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "ANTHROPIC_API_KEY" "STRIPE_SECRET_KEY" "STRIPE_WEBHOOK_SECRET")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Variable manquante: $var"
    exit 1
  fi
done

echo "✅ Variables d'environnement OK"

# Generate DB migrations if needed
echo "📦 Génération des migrations..."
npm run db:generate

# Run migrations if flag provided
if [ "$1" == "--with-migrations" ] || [ "$2" == "--with-migrations" ]; then
  echo "🗄️  Application des migrations..."
  npm run db:migrate
fi

# Build
echo "🔨 Build Next.js..."
npm run build

# Deploy
if [ "$1" == "--prod" ]; then
  echo "🚀 Déploiement PRODUCTION..."
  vercel --prod
else
  echo "🚀 Déploiement STAGING..."
  vercel
fi

echo "✅ Déploiement terminé !"
