# Guide d'installation PizzaOS

## Prérequis
- Node.js 20+
- PostgreSQL (via Supabase ou Railway)
- Compte Stripe
- Compte Groq (gratuit → https://console.groq.com)
- Compte Upstash Redis
- Compte WhatsApp Business API (Meta)

## Installation

```bash
git clone <repo> pizza-os
cd pizza-os
npm install
cp .env.example .env.local
# Remplir toutes les variables dans .env.local
```

## Base de données

```bash
npm run db:generate   # Génère les migrations
npm run db:migrate    # Applique les migrations
npm run db:seed       # Données de démo
```

## Développement

```bash
npm run dev
# → http://localhost:3000
# → Dashboard: http://localhost:3000/admin/dashboard
# → Cuisine:   http://localhost:3000/admin/kitchen
```

## Créer une pizzeria

```bash
npx tsx scripts/create-pizzeria.ts
```

## Déploiement (Vercel)

```bash
./scripts/deploy.sh              # Staging
./scripts/deploy.sh --prod --with-migrations  # Production
```

## Checklist post-déploiement

- [ ] Configurer le webhook WhatsApp (URL: `https://votre-domaine.com/api/whatsapp/webhook`)
- [ ] Configurer le webhook Stripe (URL: `https://votre-domaine.com/api/stripe/webhook`)
- [ ] Ajouter les pizzas et desserts dans le dashboard
- [ ] Configurer la capacité cuisine (Settings)
- [ ] Tester une commande WhatsApp complète
- [ ] Former l'équipe à l'interface cuisine

## Comptes de démo (après seed)

| Rôle  | Email                      | Mot de passe |
|-------|----------------------------|--------------|
| Chef  | chef@pizzaroma.com         | demo123      |
| Staff | staff@pizzaroma.com        | demo123      |
