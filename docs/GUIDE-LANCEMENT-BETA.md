# LoueTonMatos — Guide complet de mise en ligne (mode bêta puis public)

**Document de référence** — tout ce qui manque, en globalité et en détail, étape par étape.  
**Objectif** : plateforme robuste, prête au minimum en **bêta fermée**, puis ouverture publique.  
**Dernière mise à jour** : 17 mai 2026  
**Hébergement cible** : serveur **OVH** (VPS ou dédié) + **Docker** (PostgreSQL + app Next.js)

---

## Table des matières

1. [État actuel (déjà en place)](#1-état-actuel-déjà-en-place)
2. [Architecture OVH + Docker (vue d'ensemble)](#2-architecture-ovh--docker-vue-densemble)
3. [Vue d'ensemble des phases](#3-vue-densemble-des-phases)
4. [Phase 0 — Cadre juridique & administratif](#phase-0--cadre-juridique--administratif)
5. [Phase 1 — Infrastructure OVH (serveur + Docker)](#phase-1--infrastructure-ovh-serveur--docker)
6. [Optimisation serveur OVH](#optimisation-serveur-ovh)
7. [Phase 2 — Base de données & migrations](#phase-2--base-de-données--migrations)
8. [Phase 3 — Sécurité & authentification](#phase-3--sécurité--authentification)
9. [Phase 4 — Stockage fichiers (KYC + photos)](#phase-4--stockage-fichiers-kyc--photos)
10. [Phase 5 — Emails & notifications](#phase-5--emails--notifications)
11. [Phase 6 — Paiements Stripe](#phase-6--paiements-stripe)
12. [Phase 7 — Fonctionnel produit (gaps)](#phase-7--fonctionnel-produit-gaps)
13. [Phase 8 — Qualité, tests & performance](#phase-8--qualité-tests--performance)
14. [Phase 9 — Monitoring, sauvegardes & incident](#phase-9--monitoring-sauvegardes--incident)
15. [Phase 10 — Lancement bêta](#phase-10--lancement-bêta)
16. [Phase 11 — Ouverture publique (post-bêta)](#phase-11--ouverture-publique-post-bêta)
17. [Checklist finale bêta](#checklist-finale-bêta)
18. [Checklist ouverture publique](#checklist-ouverture-publique)
19. [Annexe — Variables d'environnement complètes](#annexe--variables-denvironnement-complètes)
20. [Annexe — Parcours de test manuel](#annexe--parcours-de-test-manuel)
21. [Annexe — Fichiers déploiement dans le repo](#annexe--fichiers-déploiement-dans-le-repo)

---

## 1. État actuel (déjà en place)

Avant de lister ce qui manque, voici ce qui **fonctionne déjà** en local :

| Domaine | Détail |
|---------|--------|
| Auth | Inscription email/mdp, Google OAuth, NextAuth, rôles (visiteur, PENDING, MEMBER, ADMIN) |
| Adhésion | Candidature, KYC (upload pièces), validation admin, invitations membres |
| Annonces | CRUD listings, recherche/filtres/tri, carte membres (`/listings/map`) |
| Services | CRUD prestations (pilote, chef op, etc.) |
| Membres | Annuaire verrouillé non-membres, profils |
| Réservations | Création, messagerie auto, Stripe Checkout (partiel), statuts |
| Actu | Fil social (projets, besoins), verrouillage visiteurs |
| Messagerie | Conversations réservation + contact service (polling ~5 s) |
| Admin | Candidatures, utilisateurs, réglages commission, tickets support |
| Légal | CGU, CGV, confidentialité, mentions, cookies, KYC, charte matériel, bandeau cookies |
| Acceptations | Cases à cocher inscription, candidature, réservation |

**Ce guide couvre tout le reste** pour passer du dev local à une bêta fiable.

---

## 2. Architecture OVH + Docker (vue d'ensemble)

Vous avez déjà un serveur OVH : l’objectif est de **tout faire tourner dessus** avec Docker, sans Vercel ni base managée externe (économie + contrôle + KYC sur disque persistant).

### Schéma recommandé (un seul VPS)

```
Internet
    │
    ▼
[ Nginx ou Caddy sur l'hôte ]  ← ports 80/443, Let's Encrypt
    │  reverse proxy
    ▼
[ Conteneur app Next.js ]      ← 127.0.0.1:3007 uniquement
    │
    ├── réseau Docker interne ──► [ PostgreSQL 16 ]
    │
    └── volume Docker ──────────► /uploads (KYC + futurs fichiers)
```

### Pourquoi c’est adapté à LoueTonMatos

| Besoin | Sur OVH + Docker |
|--------|------------------|
| PostgreSQL | Même `docker-compose` qu’en local, volume `pgdata` persistant |
| Fichiers KYC | Volume `uploads/` — **pas besoin de S3 en bêta** |
| Coût bêta | Un VPS 4–8 Go RAM suffit souvent |
| Données en UE | Datacenter OVH France (Gravelines, Roubaix, etc.) |
| RGPD hébergeur | OVH en tant que sous-traitant dans la politique de confidentialité |

### Ressources minimales conseillées (bêta)

| Offre OVH | RAM | Usage |
|-----------|-----|--------|
| VPS Essential | 4 Go | Bêta ~50–100 utilisateurs, polling messagerie |
| VPS Comfort | 8 Go | Confortable si PostgreSQL + Node + marge |
| Dédié | 16 Go+ | Public / forte charge |

### Fichiers fournis dans le dépôt

Voir [Annexe — Fichiers déploiement](#annexe--fichiers-déploiement-dans-le-repo) :

- `docker-compose.prod.yml` — PostgreSQL + app
- `Dockerfile` — build Next.js standalone
- `deploy/nginx/louetonmatos.conf.example` — reverse proxy
- `deploy/.env.production.example` — modèle variables prod

---

## 3. Vue d'ensemble des phases

| Phase | Objectif | Priorité bêta | Durée indicative |
|-------|----------|---------------|------------------|
| 0 | Juridique & admin réel | P0 | 1–2 semaines |
| 1 | Serveur OVH + Docker (DB + app + HTTPS) | P0 | 1–3 jours |
| 2 | Migrations Prisma versionnées | P0 | 0,5–1 jour |
| 3 | Sécurité & comptes (mdp oublié, rate limit) | P0 | 2–4 jours |
| 4 | Volume uploads KYC + photos | P0 | 1–3 jours |
| 5 | Emails Resend prod | P0 | 1 jour |
| 6 | Stripe test (puis live en public) | P1 bêta / P0 public | 3–5 jours |
| 7 | Gaps produit (calendrier, modération…) | P1 | 1–2 semaines |
| 8 | Tests & CI | P1 | 2–4 jours |
| 9 | Monitoring & backups | P0 | 1 jour |
| 10 | Lancement bêta | — | 1 jour |
| 11 | Public | — | après bêta |

**Légende priorités**  
- **P0** : bloquant pour une bêta avec de vrais utilisateurs  
- **P1** : fortement recommandé avant bêta  
- **P2** : acceptable en post-bêta / V1.1  

---

## Phase 0 — Cadre juridique & administratif

Les pages légales existent dans le code (`/legal/*`) mais contiennent des **placeholders**. Une bêta avec KYC et paiements implique un minimum de conformité réelle.

### Étape 0.1 — Constituer / valider la structure juridique

- [ ] Choisir la forme (SAS, SARL, association, etc.)
- [ ] Immatriculer la société (SIRET, RCS, capital)
- [ ] Ouvrir un compte bancaire professionnel
- [ ] Définir qui est le représentant légal (directeur de publication)

**Livrable** : identité légale complète pour les mentions légales.

### Étape 0.2 — Faire relire les documents par un avocat

Pages à valider (déjà en ligne, contenu à adapter) :

- [ ] `/legal/cgu`
- [ ] `/legal/cgv`
- [ ] `/legal/confidentialite`
- [ ] `/legal/mentions-legales`
- [ ] `/legal/cookies`
- [ ] `/legal/kyc`
- [ ] `/legal/responsabilite-materiel`

Points à valider avec le juriste :

- [ ] Modèle **sans caution** + engagement locataire en cas de casse
- [ ] Rôle de la plateforme (intermédiaire, médiation, non-assureur)
- [ ] Responsabilité P2P matériel audiovisuel
- [ ] RGPD : durées KYC, droits, sous-traitants
- [ ] Médiateur de la consommation (si B2C ou mixte)
- [ ] Assurance RC Pro / cyber de l'éditeur de la plateforme

**Livrable** : versions définitives des textes.

### Étape 0.3 — Compléter les variables légales en production

Dans le fichier `.env.production` sur le serveur, renseigner **toutes** les variables :

```env
NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr
NEXT_PUBLIC_LEGAL_COMPANY_NAME=...
NEXT_PUBLIC_LEGAL_FORM=SAS au capital de ...
NEXT_PUBLIC_LEGAL_ADDRESS=...
NEXT_PUBLIC_LEGAL_EMAIL=contact@...
NEXT_PUBLIC_LEGAL_SIRET=...
NEXT_PUBLIC_LEGAL_RCS=...
NEXT_PUBLIC_LEGAL_CAPITAL=...
NEXT_PUBLIC_LEGAL_DIRECTOR=...
NEXT_PUBLIC_DPO_EMAIL=dpo@...
```

- [ ] Vérifier l'affichage sur `/legal/mentions-legales`
- [ ] Vérifier le footer (aucun `[à compléter]` visible)

### Étape 0.4 — Registre des traitements (RGPD)

- [ ] Rédiger le registre des activités de traitement (ROPA)
- [ ] Lister les sous-traitants : OVH (hébergement), Resend, Stripe, Google OAuth (+ S3/Object Storage seulement si utilisé)
- [ ] Signer des DPA / CGU sous-traitants quand disponibles
- [ ] Documenter la procédure de demande d'accès / suppression (email DPO)

### Étape 0.5 — Politique interne KYC

- [ ] Définir qui valide les candidatures (personnes habilitées)
- [ ] Procédure en cas de pièce illisible / suspecte
- [ ] Durée de conservation effective (alignée sur `/legal/kyc`)
- [ ] Procédure de suppression après refus ou départ membre

### Étape 0.6 — Nom de domaine & emails

- [ ] Acheter le domaine (ex. `louetonmatos.fr`)
- [ ] Configurer DNS : enregistrement **A** vers l’IP publique du VPS OVH (ou **AAAA** si IPv6)
- [ ] Configurer SPF, DKIM, DMARC pour Resend (`noreply@`, `contact@`, `dpo@`)
- [ ] Vérifier que les emails ne partent pas en spam

**Critère de fin phase 0** : mentions légales complètes, avocat OK, emails pro fonctionnels.

---

## Phase 1 — Infrastructure OVH (serveur + Docker)

Cette phase suppose un **VPS OVH** (ou serveur déjà en votre possession) sous **Ubuntu 22.04/24.04** ou **Debian 12**.

### Étape 1.1 — Préparer le serveur (si pas déjà fait)

Connectez-vous en SSH :

```bash
ssh ubuntu@votre-ip   # ou root@… selon l'image OVH
```

- [ ] Mettre à jour le système : `sudo apt update && sudo apt upgrade -y`
- [ ] Créer un utilisateur déployeur (ex. `deploy`) avec sudo, clés SSH (désactiver login root/mot de passe si possible)
- [ ] Fuseau horaire : `sudo timedatectl set-timezone Europe/Paris`
- [ ] Nom d'hôte identifiable : `sudo hostnamectl set-hostname louetonmatos-prod`

### Étape 1.2 — Installer Docker sur l'hôte

```bash
# Ubuntu — script officiel Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy   # votre utilisateur
# Se reconnecter en SSH pour prendre en compte le groupe docker
```

- [ ] `docker --version` et `docker compose version` OK
- [ ] Activer Docker au démarrage : `sudo systemctl enable docker`

> **Ne pas** installer Node/npm sur l'hôte pour la prod : tout passe par l'image Docker de l'app.

### Étape 1.3 — Pare-feu OVH + UFW

**Panneau OVH** → IP → Firewall :

- [ ] Autoriser **22** (SSH, idéalement restreint à votre IP fixe)
- [ ] Autoriser **80** et **443** (HTTP/HTTPS)
- [ ] **Bloquer 5432** (PostgreSQL ne doit pas être exposé sur Internet)

Sur le serveur :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Étape 1.4 — Cloner le projet et configurer l'environnement

```bash
sudo mkdir -p /opt/louetonmatos
sudo chown deploy:deploy /opt/louetonmatos
cd /opt/louetonmatos
git clone https://github.com/ameyaprod-777/LTM-7.git .
cp deploy/.env.production.example .env.production
nano .env.production   # remplir TOUS les secrets (voir annexe)
```

Variables **obligatoires** pour le premier boot :

```env
POSTGRES_USER=louetonmatos
POSTGRES_PASSWORD=<mot de passe fort généré>
POSTGRES_DB=louetonmatos
DATABASE_URL=postgresql://louetonmatos:<password>@db:5432/louetonmatos?schema=public

NEXTAUTH_URL=https://louetonmatos.fr
NEXTAUTH_SECRET=<openssl rand -base64 32>
NODE_ENV=production
```

- [ ] `.env.production` chmod `600`, jamais commité dans Git
- [ ] `NEXT_PUBLIC_SITE_URL` = même URL que `NEXTAUTH_URL`

### Étape 1.5 — Lancer PostgreSQL + app (Docker Compose prod)

Le fichier `docker-compose.prod.yml` du repo lance :

1. **db** — PostgreSQL 16, volume persistant, **sans port public**
2. **app** — Next.js build standalone, volume `uploads` pour KYC

```bash
cd /opt/louetonmatos

# Build de l'image app (peut prendre 5–10 min la première fois)
docker compose -f docker-compose.prod.yml --env-file .env.production build

# Démarrer en arrière-plan
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Vérifier les conteneurs
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app --tail=50
```

- [ ] Conteneur `db` healthy
- [ ] Conteneur `app` écoute sur `127.0.0.1:3007` (pas exposé au monde entier)

### Étape 1.6 — Migrations base (première fois)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production \
  run --rm app npx prisma migrate deploy
```

- [ ] Migrations appliquées sans erreur
- [ ] **Ne pas** lancer `db:seed` en prod

### Étape 1.7 — Reverse proxy + HTTPS (Nginx sur l'hôte)

Installer Nginx + Certbot sur le **serveur** (pas dans Docker, plus simple pour les certificats) :

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp deploy/nginx/louetonmatos.conf.example /etc/nginx/sites-available/louetonmatos
sudo ln -s /etc/nginx/sites-available/louetonmatos /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d louetonmatos.fr -d www.louetonmatos.fr
```

- [ ] `https://votre-domaine` affiche l'app
- [ ] Renouvellement auto Certbot : `sudo certbot renew --dry-run`

**Alternative** : conteneur **Caddy** (HTTPS automatique) — voir commentaire dans `docker-compose.prod.yml`.

### Étape 1.8 — DNS OVH

Dans la zone DNS du domaine :

| Type | Nom | Cible |
|------|-----|--------|
| A | `@` | IP du VPS |
| A | `www` | IP du VPS (ou CNAME vers `@`) |

- [ ] Propagation DNS OK (`dig louetonmatos.fr`)
- [ ] Google OAuth : redirect URI = `https://domaine/api/auth/callback/google`

### Étape 1.9 — Déploiement des mises à jour (workflow)

À chaque release :

```bash
cd /opt/louetonmatos
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.production build app
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
docker compose -f docker-compose.prod.yml --env-file .env.production \
  run --rm app npx prisma migrate deploy
```

- [ ] Script `deploy/deploy.sh` (optionnel) pour automatiser
- [ ] Tester en local/staging avant `git pull` sur prod

### Étape 1.10 — Comptes services externes

- [ ] GitHub (repo + accès serveur via deploy key si CI)
- [ ] Resend — phase 5
- [ ] Stripe — phase 6
- [ ] Sentry — phase 9
- [ ] Google Cloud (OAuth)

**Critère de fin phase 1** : `https://domaine` OK, DB Docker persistante, uploads KYC sur volume, pas de port 5432 public.

---

## Optimisation serveur OVH

Section dédiée pour **tirer le meilleur** d’un VPS déjà en service (souvent 2–8 Go RAM).

### A. Règle d’or : ne pas tout exposer

| Service | Exposition |
|---------|------------|
| PostgreSQL | Réseau Docker **interne uniquement** |
| Next.js | `127.0.0.1:3007` → Nginx seulement |
| SSH | Port 22, IP restreinte si possible |
| Prisma Studio / pgAdmin | **Jamais** en prod sur Internet |

### B. Limites mémoire Docker (éviter OOM)

Dans `docker-compose.prod.yml`, des limites sont déjà suggérées :

- PostgreSQL : ~512 Mo–1 Go selon VPS
- App Node : ~1–2 Go

Sur un VPS **4 Go RAM** :

```
~1 Go  → PostgreSQL
~1,5 Go → Node (Next.js)
~0,5 Go → OS + Nginx
~1 Go  → marge / pics
```

Si l’app est tuée (`OOMKilled`) : réduire les workers Node (`NODE_OPTIONS=--max-old-space-size=1024`) ou passer au VPS 8 Go.

### C. PostgreSQL : réglages légers (VPS petit)

Créer `deploy/postgres/postgresql.conf.snippet` monté dans le conteneur, ou variables :

```ini
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
max_connections = 50
```

- [ ] En bêta, `max_connections=50` largement suffisant
- [ ] Monitorer : `docker stats` pendant une session de tests

### D. Swap (file d’attente disque)

Si RAM ≤ 4 Go, ajouter **2 Go de swap** (sécurité, pas performance) :

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### E. Stockage : volumes et sauvegardes

| Volume | Contenu | Sauvegarde |
|--------|---------|------------|
| `louetonmatos_pgdata` | Base PostgreSQL | `pg_dump` quotidien (cron) |
| `louetonmatos_uploads` | KYC, futurs médias | `rsync` ou snapshot OVH |

Exemple cron backup (utilisateur `deploy`) :

```bash
# /etc/cron.daily/louetonmatos-backup
docker exec louetonmatos-db pg_dump -U louetonmatos louetonmatos | gzip > /backup/ltm-$(date +%F).sql.gz
find /backup -name 'ltm-*.sql.gz' -mtime +14 -delete
```

- [ ] Dossier `/backup` hors du repo, copie optionnelle vers Object Storage OVH

### F. Logs et rotation

```bash
# Limiter la taille des logs Docker
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```

```bash
sudo systemctl restart docker
```

### G. Sécurité complémentaire

- [ ] `fail2ban` sur SSH : `sudo apt install fail2ban`
- [ ] Mises à jour auto sécurité : `sudo apt install unattended-upgrades`
- [ ] Sauvegardes **snapshot VPS** activées dans le manager OVH (1 clic restore)

### H. Staging sur le même serveur (option économique)

Deux dossiers `/opt/louetonmatos-staging` et `/opt/louetonmatos` avec :

- ports différents (ex. app staging sur `127.0.0.1:3001`)
- sous-domaine `staging.louetonmatos.fr`
- **base PostgreSQL séparée** (autre conteneur ou autre volume)

Évite de payer un second VPS en bêta.

### I. Quand passer à autre chose qu’un seul VPS

| Signal | Action |
|--------|--------|
| CPU/RAM saturés en permanence | VPS supérieur ou 2e serveur DB |
| Besoin haute dispo | Load balancer OVH + 2 instances |
| KYC très volumineux | Object Storage OVH (compatible S3) en complément du volume |
| Trafic mondial CDN | Cloudflare devant Nginx |

**Pour la bêta**, un VPS OVH bien configuré + Docker est en général **suffisant et plus simple** que Vercel + Neon + S3.

---

## Phase 2 — Base de données & migrations

Aujourd'hui le projet utilise surtout `prisma db push`. En production, il faut des **migrations versionnées**.

### Étape 2.1 — Créer la migration initiale

En local, à partir du schéma actuel :

```bash
# S'assurer que le schéma local reflète prisma/schema.prisma
npm run db:push

# Créer la première migration nommée
npx prisma migrate dev --name init
```

- [ ] Dossier `prisma/migrations/` créé et commité dans Git
- [ ] Vérifier le SQL généré (indexes, contraintes, enums)

### Étape 2.2 — Appliquer en production

```bash
# Avec DATABASE_URL de prod (une seule fois ou via CI)
npx prisma migrate deploy
```

- [ ] Migrations appliquées sur le conteneur PostgreSQL sans erreur
- [ ] **Ne pas** utiliser `db push` en prod après ça

### Étape 2.3 — Données initiales production (sans seed démo)

- [ ] Créer **un seul** compte admin manuellement (Prisma Studio ou script dédié) :
  - Email réel, mot de passe fort (pas `Admin123!`)
  - `role: ADMIN`, `membershipStatus` ou équivalent validé
- [ ] Supprimer toute référence aux comptes démo en prod
- [ ] Paramètres plateforme (`PlatformSettings`) : commission, invitations ON/OFF

### Étape 2.4 — Workflow futur

À chaque changement de schéma :

1. `npx prisma migrate dev --name description_changement`
2. Commit migration
3. `git pull` sur le serveur → rebuild image → `prisma migrate deploy` (ou script `deploy/deploy.sh`)

- [ ] Ajouter script `package.json` : `"db:migrate:deploy": "prisma migrate deploy"`
- [ ] Optionnel : GitHub Action sur push `main` pour `migrate deploy`

### Étape 2.5 — Sauvegardes base (Docker sur OVH)

- [ ] Cron `pg_dump` quotidien vers `/backup` (voir section Optimisation)
- [ ] Tester une restauration : `gunzip -c backup.sql.gz | docker exec -i louetonmatos-db psql -U louetonmatos louetonmatos`
- [ ] Snapshot VPS OVH hebdomadaire activé
- [ ] Documenter RPO/RTO (ex. perte max 24 h acceptable en bêta)

**Critère de fin phase 2** : schéma prod = schéma Git, un admin réel, pas de seed démo.

---

## Phase 3 — Sécurité & authentification

### Étape 3.1 — Secrets & rotation

- [ ] `NEXTAUTH_SECRET` : 32+ octets aléatoires, unique prod
- [ ] Ne jamais committer `.env` (vérifier `.gitignore`)
- [ ] Limiter l'accès SSH au serveur (clés uniquement, pas de mot de passe root)
- [ ] Planifier rotation des secrets tous les 6–12 mois

### Étape 3.2 — Google OAuth production

1. Google Cloud Console → projet → APIs & Services → Credentials
2. OAuth 2.0 Client ID type **Web**
3. Authorized JavaScript origins : `https://votre-domaine.fr`
4. Authorized redirect URIs : `https://votre-domaine.fr/api/auth/callback/google`

- [ ] `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans `.env.production` sur le serveur
- [ ] Tester connexion Google en prod

### Étape 3.3 — Mot de passe oublié (MANQUANT — P0)

À implémenter :

- [ ] Modèle ou table `PasswordResetToken` (token, userId, expiresAt)
- [ ] Page `/forgot-password` + formulaire email
- [ ] API `POST /api/auth/forgot-password` → email lien Resend (expire 1 h)
- [ ] Page `/reset-password?token=...` + API `POST /api/auth/reset-password`
- [ ] Rate limit sur forgot-password (voir 3.5)
- [ ] Message générique si email inconnu (ne pas révéler l'existence du compte)

### Étape 3.4 — Vérification email à l'inscription (P1)

- [ ] Champ `emailVerified` sur User (Prisma + NextAuth)
- [ ] Email de vérification à l'inscription
- [ ] Bloquer certaines actions tant que non vérifié (optionnel en bêta : warning seulement)

### Étape 3.5 — Rate limiting (MANQUANT — P0)

Protéger au minimum :

- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/[...nextauth]` (login)
- [ ] `POST /api/auth/forgot-password`
- [ ] `POST /api/membership/apply` (upload KYC)
- [ ] `POST /api/messages`
- [ ] `POST /api/geocode`

Options techniques :

- Upstash Redis + `@upstash/ratelimit`
- Ou Redis sur le même serveur (conteneur `redis:alpine`) + rate limit en middleware/API
- Ou `next-rate-limit` avec store Redis

Règles suggérées bêta :

| Route | Limite |
|-------|--------|
| Login | 10 / 15 min / IP |
| Register | 5 / heure / IP |
| KYC apply | 3 / jour / user |
| API générale | 100 / min / IP |

### Étape 3.6 — Headers de sécurité

- [ ] Configurer dans `next.config.js` :
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (caméra, micro si non utilisés)
- [ ] CSP progressive (attention Next.js / Stripe / Leaflet)

### Étape 3.7 — Durcissement admin

- [ ] Route `/admin/*` : vérifier rôle ADMIN côté middleware + layout
- [ ] Journaliser les actions sensibles (approbation KYC, ban user) — voir phase 9
- [ ] 2FA pour comptes admin (P2, recommandé avant public)

### Étape 3.8 — RGPD — droits utilisateur

- [ ] Page ou flux « Supprimer mon compte » dans `/dashboard/settings`
- [ ] API suppression : anonymiser ou supprimer user + KYC + messages selon politique
- [ ] Export des données personnelles (P2)

**Critère de fin phase 3** : OAuth prod, mdp oublié, rate limits actifs, pas de comptes seed en prod.

---

## Phase 4 — Stockage fichiers (KYC + photos)

### Contexte OVH + Docker

Sur un VPS, le filesystem **est persistant** via un volume Docker. Le stockage KYC local (`uploads/kyc/`) **fonctionne en production** — c’est un avantage majeur par rapport à Vercel.

### Étape 4.1 — KYC sur volume Docker (recommandé bêta OVH) — P0

1. Le `docker-compose.prod.yml` monte un volume nommé `uploads` sur `/app/uploads`
2. Le code actuel (`src/lib/kyc-storage.ts`) écrit déjà dans `uploads/kyc/`

Checklist :

- [ ] Volume `louetonmatos_uploads` créé au premier `docker compose up`
- [ ] Sauvegarder ce volume avec les dumps DB (rsync `/var/lib/docker/volumes/...` ou backup depuis conteneur)
- [ ] Nginx : **ne jamais** servir `/uploads` en statique public
- [ ] L’API admin KYC reste la seule voie de lecture (auth ADMIN)
- [ ] Permissions conteneur : utilisateur non-root dans le Dockerfile si possible

Test :

- [ ] Candidature avec pièces en prod → fichiers présents après redémarrage des conteneurs
- [ ] `docker compose restart app` → KYC toujours accessible côté admin

### Étape 4.1 bis — Object Storage OVH (optionnel, P2)

Utile si vous ajoutez un **2e serveur** ou si le volume disque est trop petit :

- OVH Object Storage (API compatible S3) ou Scaleway
- Migrer `kyc-storage.ts` vers S3 plus tard
- En bêta sur un seul VPS : **pas obligatoire**

### Étape 4.2 — Upload photos annonces & services — P1

Option A : **Uploadthing** (déjà prévu dans `.env.example`)  
Option B : **Cloudinary**

1. Créer compte, obtenir clés
2. Intégrer widget upload dans `listing-form.tsx` et `service-form.tsx`
3. API route upload ou direct client → stockage
4. Limiter : taille max, types MIME, 10 photos listing / 6 services
5. Scan antivirus (P2) ou modération manuelle admin

- [ ] Remplacer le champ « URL photo » par upload natif
- [ ] Migration : annonces existantes gardent URLs externes si besoin

### Étape 4.3 — Politique de rétention fichiers

- [ ] Cron ou job : supprimer KYC expirés selon politique
- [ ] Documenter dans la politique KYC

**Critère de fin phase 4** : KYC persistant sur volume Docker + backups ; photos uploadables (P1 pour bêta stricte).

---

## Phase 5 — Emails & notifications

### Étape 5.1 — Resend en production

- [ ] Domaine vérifié dans Resend
- [ ] `RESEND_API_KEY` en prod
- [ ] `EMAIL_FROM=LoueTonMatos <noreply@votre-domaine.fr>`

### Étape 5.2 — Emails transactionnels à vérifier / compléter

| Événement | Fichier / fonction | Statut |
|-----------|-------------------|--------|
| Candidature approuvée | `membershipApprovedEmail` | Existe — tester prod |
| Nouvelle candidature admin | `adminNewApplicationEmail` | Existe — tester prod |
| Mot de passe oublié | — | **À créer** |
| Vérification email | — | **À créer** (P1) |
| Réservation confirmée (locataire + loueur) | — | **À créer** (P1) |
| Nouveau message (digest ou instant) | — | **À créer** (P2) |
| Paiement reçu / remboursé | — | **À créer** (P1 si Stripe) |

- [ ] Tester chaque email en prod (boîte réelle, pas spam)
- [ ] Templates HTML sobres + lien vers dashboard

### Étape 5.3 — Notifications in-app

- [ ] Vérifier cloche notifications sur événements clés
- [ ] Aligner emails + notifications pour les mêmes événements

**Critère de fin phase 5** : au minimum adhésion + reset password OK en prod.

---

## Phase 6 — Paiements Stripe

### État actuel

- Checkout session + webhook `checkout.session.completed`
- Sans clés : réservation **auto-confirmée** (mode dev) → **DANGEREUX en prod**
- Pas de Stripe Connect (versement aux loueurs)
- Annulation : statut `REFUNDED` en base **sans** remboursement carte réel

### Étape 6.1 — Désactiver le mode « faux paiement » en production

- [ ] Dans `src/app/api/bookings/route.ts` : si `NODE_ENV === 'production'` et Stripe non configuré → **refuser** la réservation payante ou exiger paiement hors plateforme explicite
- [ ] Ne jamais auto-confirmer une réservation payante sans webhook en prod

### Étape 6.2 — Stripe Test (bêta)

1. Compte Stripe → mode Test
2. Variables dans `.env.production` sur le serveur (valeurs **test** pour la bêta) :

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. Webhook endpoint : `https://votre-domaine.fr/api/stripe/webhook`
4. Événements : `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed` (à étendre)

- [ ] Tester réservation bout en bout avec carte test `4242...`
- [ ] Vérifier statut booking + payment en base après webhook

### Étape 6.3 — Remboursements réels (P1 bêta / P0 public)

- [ ] Sur action `cancel` : appeler `stripe.refunds.create` si paiement capturé
- [ ] Gérer les webhooks `charge.refunded`
- [ ] Tests : annulation avant / après confirmation

### Étape 6.4 — Stripe Connect (P1 bêta, P0 public si encaissement)

Pour payer les loueurs automatiquement :

- [ ] Activer Connect dans le dashboard Stripe
- [ ] Onboarding loueur : `stripeAccountId` sur User (champ déjà prévu en schéma si présent)
- [ ] Page `/dashboard/settings/payments` : lien onboarding Connect
- [ ] Checkout en mode destination charge ou separate charges and transfers
- [ ] Commission plateforme : alignée sur `PlatformSettings.commissionRate`

### Étape 6.5 — Stripe Live (ouverture publique uniquement)

- [ ] Passer les clés `sk_live_` / `pk_live_`
- [ ] Reconfigurer webhook en live
- [ ] Vérifier mentions légales / CGV conformes aux flux de paiement
- [ ] Facturation : reçus Stripe ou génération factures PDF (P2)

**Critère de fin phase 6 (bêta)** : paiement test fonctionnel, pas d'auto-confirm sans Stripe, webhooks OK.

---

## Phase 7 — Fonctionnel produit (gaps)

### Étape 7.1 — Calendrier de disponibilité (P1)

**Manquant** : modèle `BlockedDate` existe, **pas d'UI**.

- [ ] Page ou section dans édition listing : calendrier pour bloquer dates
- [ ] API `POST/DELETE /api/listings/[id]/blocked-dates`
- [ ] Vérifier conflits à la réservation (partiellement en place — auditer `booking-utils`)

### Étape 7.2 — Modération Actu / annonces (P1)

- [ ] Interface admin pour épingler / verrouiller posts forum (API existe partiellement)
- [ ] Signalement contenu par les membres
- [ ] File de modération admin

### Étape 7.3 — Messagerie temps réel (P2 pour bêta)

Actuel : polling 5 s.

- [ ] Intégrer Pusher ou Ably (variables déjà dans `.env.example`)
- [ ] Éviter surcharge serveur en bêta si beaucoup d'utilisateurs

### Étape 7.4 — Parcours réservation & litiges

- [ ] États des lieux : checklist ou upload photos début/fin (P1)
- [ ] Bouton « Signaler un problème » sur réservation → ticket support
- [ ] Workflow médiation aligné sur charte matériel

### Étape 7.5 — SEO & pages erreur (P1)

- [ ] `app/robots.ts` ou `public/robots.txt`
- [ ] `app/sitemap.ts` (listings publics si applicable)
- [ ] Pages `not-found.tsx` et `error.tsx` brandées
- [ ] Open Graph / metadata par page listing

### Étape 7.6 — README & documentation interne

- [ ] Mettre à jour `README.md` (forum, services, carte, légal, KYC)
- [ ] Document runbook admin (approuver membre, gérer litige)

### Étape 7.7 — Invitations bêta

Déjà en place — à configurer pour bêta fermée :

- [ ] `invitationsEnabled` dans admin settings : ON
- [ ] Communication : « bêta sur invitation uniquement »
- [ ] Limiter les inscriptions ouvertes si souhaité (middleware ou flag)

### Étape 7.8 — i18n, Apple Sign-In, app mobile (P2 — post-bêta)

Reporter après validation du marché français.

**Critère de fin phase 7 (bêta minimale)** : calendrier OU process manuel documenté, modération de base, SEO minimal.

---

## Phase 8 — Qualité, tests & performance

### Étape 8.1 — Tests automatisés (MANQUANT — P1)

- [ ] Installer Playwright ou Cypress
- [ ] Tests E2E critiques :
  1. Inscription + acceptation CGU
  2. Login
  3. Candidature (mock fichiers KYC)
  4. Admin approuve (test env)
  5. Création listing
  6. Réservation + acceptation charte matériel
- [ ] Tests API (Vitest + supertest) sur routes auth, bookings
- [ ] CI GitHub Actions : `lint` + `build` + tests sur chaque PR

### Étape 8.2 — Lint & types

- [ ] `npm run lint` sans erreur en CI
- [ ] Corriger warnings `react-hooks/exhaustive-deps` si pertinent

### Étape 8.3 — Performance

- [ ] Audit Lighthouse sur `/`, `/listings`, `/listings/map`
- [ ] Images : `next/image` partout où possible
- [ ] Carte Leaflet : lazy load
- [ ] Plausible self-hosted ou Umami (sur le même VPS) / Plausible cloud (après consentement cookies)

### Étape 8.4 — Accessibilité (P2)

- [ ] Navigation clavier formulaires
- [ ] Labels aria bandeau cookies (déjà partiel)

**Critère de fin phase 8** : CI verte, 1 parcours E2E vert, build prod stable.

---

## Phase 9 — Monitoring, sauvegardes & incident

### Étape 9.1 — Sentry (ou équivalent)

- [ ] Projet Sentry, `SENTRY_DSN` dans `.env.production`
- [ ] `sentry.client.config.ts` + `sentry.server.config.ts`
- [ ] Alertes email sur erreurs 5xx

### Étape 9.2 — Logs & audit admin

- [ ] Logs : `docker compose logs`, rotation configurée (voir Optimisation)
- [ ] Table `AuditLog` (adminId, action, targetId, createdAt) pour KYC / ban / réglages

### Étape 9.3 — Uptime

- [ ] UptimeRobot ou Better Stack ping sur `https://domaine/api/health`  
  → **Créer** `GET /api/health` (DB ping simple)

### Étape 9.4 — Plan incident

Document interne (1 page) :

- [ ] Qui est astreinte
- [ ] Comment couper les inscriptions / passer maintenance
- [ ] Comment contacter OVH support / Stripe / Resend
- [ ] Communication utilisateurs (status page P2)

**Critère de fin phase 9** : erreurs visibles, healthcheck, backups DB testés.

---

## Phase 10 — Lancement bêta

### Étape 10.1 — Environnement staging (recommandé)

- [ ] Environnement `staging` sur le même VPS (sous-domaine + 2e stack Docker) ou 2e petit VPS
- [ ] Tester toute la checklist sur staging avant prod

### Étape 10.2 — Checklist pré-lancement (jour J-1)

Parcourir [Annexe — Parcours de test manuel](#annexe--parcours-de-test-manuel) sur **production** avec 2 comptes réels.

- [ ] Aucun compte `Admin123!` / seed
- [ ] Variables légales complètes
- [ ] KYC volume Docker OK + backup uploads
- [ ] Emails reçus
- [ ] Stripe test OK (si paiement activé)
- [ ] Bandeau cookies OK
- [ ] Rate limits actifs

### Étape 10.3 — Lancement soft

- [ ] Inviter 10–30 créatifs de confiance (liens invitation)
- [ ] Canal feedback (email dédié ou Discord privé)
- [ ] Annoncer clairement : **bêta**, bugs possibles, pas de caution, charte matériel

### Étape 10.4 — Suivi première semaine

- [ ] Daily check Sentry + candidatures KYC
- [ ] Corriger bugs P0 sous 24–48 h
- [ ] Noter les retours pour V1.1

**Critère de fin** : 10+ membres actifs, 5+ locations ou réservations test sans incident majeur.

---

## Phase 11 — Ouverture publique (post-bêta)

À faire **après** stabilisation bêta (souvent 4–8 semaines).

| # | Action |
|---|--------|
| 1 | Stripe **Live** + Connect production |
| 2 | Assurance RC Pro plateforme + communication claire aux membres |
| 3 | Médiateur consommation désigné dans mentions légales |
| 4 | Upload photos obligatoire, modération renforcée |
| 5 | Ouverture inscription sans invitation (si souhaité) |
| 6 | Campagne communication / SEO |
| 7 | Tests de charge (k6 ou équivalent) |
| 8 | CGU/CGV versionnées avec historique des acceptations |

---

## Checklist finale bêta

Cocher **tous** les P0 avant d'inviter des utilisateurs externes.

### Juridique & confiance
- [ ] Mentions légales complètes (SIRET, RCS, etc.)
- [ ] Textes relus par avocat
- [ ] Variables `NEXT_PUBLIC_LEGAL_*` en prod
- [ ] Emails domaine vérifiés (SPF/DKIM)

### Infrastructure
- [ ] VPS OVH + domaine HTTPS (Nginx/Certbot)
- [ ] Docker Compose prod (db + app) + migrations `migrate deploy`
- [ ] Port 5432 non exposé, UFW + firewall OVH OK
- [ ] Un admin prod (pas seed)
- [ ] Pas de `db:seed` en prod

### Sécurité
- [ ] `NEXTAUTH_SECRET` fort
- [ ] Google OAuth prod
- [ ] Mot de passe oublié
- [ ] Rate limiting APIs sensibles
- [ ] KYC sur volume Docker (ou Object Storage si choisi)

### Produit
- [ ] Acceptations légales (inscription, candidature, réservation) OK
- [ ] Stripe test OU désactivation paiement explicite
- [ ] Emails adhésion OK
- [ ] Healthcheck `/api/health`
- [ ] Sentry actif

### Ops
- [ ] Backups DB
- [ ] Parcours test manuel validé
- [ ] Runbook admin rédigé

---

## Checklist ouverture publique

En plus de la bêta :

- [ ] Stripe Live + remboursements réels
- [ ] Stripe Connect + onboarding loueurs
- [ ] Upload photos natif
- [ ] Vérification email
- [ ] Suppression compte RGPD
- [ ] Modération + signalements
- [ ] Tests E2E CI
- [ ] Médiateur + assurances documentées
- [ ] Calendrier disponibilité
- [ ] Factures / reçus

---

## Annexe — Variables d'environnement complètes

| Variable | Obligatoire bêta | Description |
|----------|------------------|-------------|
| `DATABASE_URL` | Oui | `postgresql://user:pass@db:5432/louetonmatos` (hostname `db` = service Docker) |
| `POSTGRES_USER` / `PASSWORD` / `DB` | Oui | Utilisés par le conteneur PostgreSQL |
| `NEXTAUTH_URL` | Oui | URL canonique https://domaine |
| `NEXTAUTH_SECRET` | Oui | Secret session |
| `GOOGLE_CLIENT_ID` | Recommandé | OAuth |
| `GOOGLE_CLIENT_SECRET` | Recommandé | OAuth |
| `RESEND_API_KEY` | Oui | Emails |
| `EMAIL_FROM` | Oui | Expéditeur vérifié |
| `STRIPE_SECRET_KEY` | Si paiement | Mode test en bêta |
| `STRIPE_PUBLISHABLE_KEY` | Si paiement | Frontend futur |
| `STRIPE_WEBHOOK_SECRET` | Si paiement | Webhooks |
| `AWS_*` + `AWS_S3_KYC_BUCKET` | Non (bêta OVH) | Optionnel si Object Storage plus tard |
| `UPLOADTHING_*` ou Cloudinary | P1 | Photos |
| `NEXT_PUBLIC_SITE_URL` | Oui | Liens absolus |
| `NEXT_PUBLIC_LEGAL_*` | Oui | Mentions légales |
| `NEXT_PUBLIC_DPO_EMAIL` | Oui | RGPD |
| `PUSHER_*` | Non | Temps réel P2 |
| `SENTRY_DSN` | Recommandé | Monitoring |

---

## Annexe — Parcours de test manuel

À exécuter sur **staging puis prod** avant bêta. Noter la date et le résultat.

### A. Visiteur non connecté
1. [ ] Accueil s'affiche
2. [ ] `/listings` : aperçu flouté, CTA inscription
3. [ ] `/members`, `/forum` : verrouillés
4. [ ] Footer : tous les liens `/legal/*` accessibles
5. [ ] Bandeau cookies : accepter / essentiels → ne réapparaît pas

### B. Inscription & candidature
6. [ ] `/register` : création compte + case CGU obligatoire
7. [ ] `/apply` : formulaire + upload KYC + cases légales
8. [ ] Email admin « nouvelle candidature » reçu
9. [ ] Statut PENDING : bannière, accès limité cohérent

### C. Admin
10. [ ] Login admin prod
11. [ ] `/admin/membership` : voir pièces KYC (servies par l’API admin, fichiers sur volume)
12. [ ] Approuver candidature → membre + email approbation
13. [ ] Refuser autre test → pièces supprimées selon politique

### D. Membre — annonce & location
14. [ ] Créer une annonce (photos upload ou URL)
15. [ ] Apparaît sur `/listings` et `/listings/map` (si coords)
16. [ ] Second compte membre : réserver avec charte matériel cochée
17. [ ] Conversation créée, message visible
18. [ ] Si Stripe test : paiement carte 4242 → webhook → statut confirmé

### E. Litige simulé (process)
19. [ ] Lire `/legal/responsabilite-materiel` — compréhensible
20. [ ] Ouvrir ticket support ou message loueur en cas de souci

### F. Sécurité rapide
21. [ ] Tentatives login invalides : rate limit déclenché
22. [ ] URL admin sans rôle : refus
23. [ ] Fichier KYC : URL non devinable / non public

---

## Synthèse : ordre d'exécution recommandé

Pour aller vite vers une **bêta robuste**, enchaîner dans cet ordre :

```
Phase 0 (juridique réel)
    ↓
Phase 1 (OVH : Docker + Nginx + HTTPS)
    ↓
Phase 2 (migrations + admin prod)
    ↓
Phase 4 (volume uploads KYC + backup disque)
    ↓
Phase 3 (sécurité : mdp oublié, rate limit)
    ↓
Phase 5 (emails prod)
    ↓
Phase 6 (Stripe test + couper auto-confirm)
    ↓
Phase 9 (Sentry + health + backups)
    ↓
Phase 8 (CI + 1 test E2E)  ← en parallèle si possible
    ↓
Phase 7 (calendrier, modération — selon temps)
    ↓
Phase 10 (invitations bêta)
    ↓
Phase 11 (public, plus tard)
```

---

## Contact & maintenance du document

- Mettre à jour ce fichier à chaque jalon (bêta lancée, Stripe live, etc.)
- Cocher les cases dans Git ou copier dans Notion/Linear pour le suivi projet

**Rappel** : ce document ne constitue pas un conseil juridique. Faire valider les aspects légaux, assurance et paiement par des professionnels avant encaissement réel à grande échelle.

---

## Annexe — Fichiers déploiement dans le repo

| Fichier | Rôle |
|---------|------|
| `docker-compose.yml` | Dev local : PostgreSQL seul |
| `docker-compose.prod.yml` | Prod OVH : PostgreSQL + app Next.js |
| `Dockerfile` | Build image production (standalone) |
| `deploy/.env.production.example` | Modèle variables serveur |
| `deploy/nginx/louetonmatos.conf.example` | Reverse proxy Nginx |
| `deploy/deploy.sh` | Script `git pull` + rebuild + migrations |

Commandes rapides sur le serveur :

```bash
cd /opt/louetonmatos
cp deploy/.env.production.example .env.production && nano .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
./deploy/deploy.sh   # mises à jour suivantes
```

---

*Fin du guide — LoueTonMatos*
