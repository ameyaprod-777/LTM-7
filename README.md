# LoueTonMatos

**Louez entre créatifs, en confiance.**

Plateforme de location peer-to-peer de matériel audiovisuel — Next.js 14, Prisma, PostgreSQL, NextAuth, Stripe (phase 2).

## Stack

- **Framework** : Next.js 14 (App Router) + TypeScript
- **UI** : Tailwind CSS (anthracite + orange électrique)
- **Base de données** : PostgreSQL + Prisma 5
- **Auth** : NextAuth.js (credentials + Google OAuth)
- **Email** : Resend
- **Paiements** : Stripe Connect (à venir)

## Démarrage local

### 1. Prérequis

- Node.js 18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (PostgreSQL via Docker)

### 2. Installation

```bash
cp .env.example .env
# NEXTAUTH_SECRET : openssl rand -base64 32

npm install

# Démarrer PostgreSQL dans Docker
npm run db:up

# Créer les tables + données de démo
npm run db:push
npm run db:seed

npm run dev
```

Ou en une commande (Docker + schéma + seed) :

```bash
npm run db:setup
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Base de données Docker

Le fichier `docker-compose.yml` lance **PostgreSQL 16** :

| Paramètre | Valeur |
|-----------|--------|
| Hôte | `localhost:5432` |
| Base | `louetonmatos` |
| Utilisateur | `louetonmatos` |
| Mot de passe | `louetonmatos` |

```bash
npm run db:up      # Démarrer le conteneur
npm run db:down    # Arrêter
npm run db:logs    # Voir les logs PostgreSQL
npm run db:reset   # Supprimer les données + recréer + seed
npm run db:studio  # Interface Prisma Studio
```

> Si le port **5432** est déjà pris sur votre machine, modifiez dans `docker-compose.yml` la ligne `"5432:5432"` en `"5433:5432"` et mettez à jour `DATABASE_URL` avec le port `5433`.

### Comptes de démo (après seed)

| Rôle   | Email                    | Mot de passe |
|--------|--------------------------|--------------|
| Admin  | admin@louetonmatos.fr    | Admin123!    |
| Membre | membre@louetonmatos.fr   | Member123!   |

## Flux d'adhésion (implémenté)

1. **Inscription** (`/register`) — email/mot de passe ou Google
2. **Candidature** (`/apply`) — profil, bio, motivation, domaine créatif
3. **Statut PENDING** — bannière + accès limité (listings en lecture, forum RO)
4. **Admin** (`/admin/membership`) — approuver / refuser + notification email
5. **MEMBER** — accès complet au tableau de bord

### Invitation membre

- Un membre génère un lien depuis `/dashboard` (valide 7 jours, usage unique)
- Le lien `/invite/[token]` redirige vers l'inscription puis `/apply?invite=…`

## Niveaux d'accès

| Niveau        | Listings détail | Louer | Publier | Forum écriture | Messages |
|---------------|-----------------|-------|---------|----------------|----------|
| Visiteur      | Non (flouté)    | Non   | Non     | Non            | Non      |
| Pending       | Titres + photos | Non   | Non     | Lecture seule  | Non      |
| Membre        | Oui             | Oui   | Oui     | Oui            | Oui      |
| Admin         | Oui             | Oui   | Oui     | Oui + modération | Oui    |

## Structure des routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/listings` | Catalogue (accès selon rôle) |
| `/apply` | Formulaire de candidature |
| `/dashboard` | Espace membre |
| `/admin` | Tableau de bord admin |
| `/admin/membership` | File d'attente candidatures |
| `/forum` | Forum (squelette) |
| `/invite/[token]` | Landing invitation |

## Documentation

| Document | Contenu |
|----------|---------|
| [docs/CONFIGURATION-STRIPE.md](docs/CONFIGURATION-STRIPE.md) | Clés API Stripe, webhooks, Connect, tests carte |
| [docs/GUIDE-LANCEMENT-BETA.md](docs/GUIDE-LANCEMENT-BETA.md) | Checklist complète bêta → production |
| [docs/GAPS-APPLICATION.md](docs/GAPS-APPLICATION.md) | Écarts fonctionnels et priorités |

## Déploiement Vercel

1. Créer un projet Vercel lié au repo
2. Variables d'environnement : copier depuis `.env.example`
3. Base PostgreSQL : Neon recommandé
4. Build command : `npm run build` (inclut `prisma generate`)
5. Après déploiement : `npx prisma db push` puis `npx prisma db seed` (ou migration CI)

## Prochaines phases

- [ ] Listings CRUD + upload photos (Uploadthing / Cloudinary)
- [ ] Réservations + Stripe Connect + calendrier
- [ ] Messagerie temps réel (Pusher)
- [ ] Forum complet
- [ ] i18n (fr-FR / en)
- [ ] Apple Sign-In

## Scripts

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run db:up        # PostgreSQL Docker (démarrer)
npm run db:setup     # Docker + push + seed
npm run db:push      # Sync schéma Prisma → DB
npm run db:migrate   # Migrations versionnées
npm run db:seed      # Données de démo
npm run db:studio    # Prisma Studio
```
