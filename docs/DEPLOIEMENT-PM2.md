# Déploiement VPS — PM2 (comme tes autres projets)

Pas de Docker. **git pull → build → PM2 restart**, comme `ameyawebsite` et `lemoonkey`.

---

## Prérequis serveur (une seule fois)

- Node.js 20+
- PM2 (`npm i -g pm2`)
- PostgreSQL (local ou Neon)
- Nginx → `127.0.0.1:3007`

```bash
# PostgreSQL local (exemple)
sudo apt install -y postgresql
sudo -u postgres psql -c "CREATE USER louetonmatos WITH PASSWORD 'VOTRE_MDP';"
sudo -u postgres psql -c "CREATE DATABASE louetonmatos OWNER louetonmatos;"
```

---

## Installation initiale

```bash
cd ~/louetonmatos   # ton dossier existant
git clone https://github.com/ameyaprod-777/LTM-7.git .   # si vide
# ou : git remote set-url origin https://github.com/ameyaprod-777/LTM-7.git

cp deploy/.env.production.example .env.production
nano .env.production
# DATABASE_URL=postgresql://louetonmatos:...@localhost:5432/louetonmatos?schema=public
# NEXTAUTH_URL=https://louetonmatos.fr
# + Stripe, Resend, etc.

chmod 600 .env.production
chmod +x deploy/pm2-deploy.sh

# Hook : git pull déclenche le deploy automatiquement
git config core.hooksPath .githooks
chmod +x .githooks/post-merge

# Premier déploiement
./deploy/pm2-deploy.sh

# PM2 au reboot
pm2 startup
pm2 save
```

---

## Mises à jour (quotidien)

Depuis Cursor : push sur `main`.

Sur le VPS :

```bash
cd ~/louetonmatos
git pull
```

C’est tout — le hook `post-merge` lance build + migrations + `pm2 restart`.

Sans hook, manuel :

```bash
./deploy/pm2-deploy.sh
```

---

## Nginx

```nginx
upstream louetonmatos_app {
    server 127.0.0.1:3007;
}
```

Fichier exemple : `deploy/nginx/louetonmatos.conf.example`

---

## Commandes utiles

```bash
pm2 list
pm2 logs louetonmatos
curl http://127.0.0.1:3007/api/health
npx prisma migrate status
```

---

## Connexion Google (OAuth)

Sans `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, le bouton Google est **masqué**.

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → créer un projet (ou en choisir un)
2. **Écran de consentement OAuth** → External → renseigner app + email support
3. **Credentials** → Create credentials → **OAuth client ID** → type **Web application**
4. Authorized JavaScript origins :
   - `https://louetonmatos.fr`
   - `http://localhost:3000` (dev)
5. Authorized redirect URIs :
   - `https://louetonmatos.fr/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
6. Copier Client ID + Secret dans `.env.production` (et `.env` en local)
7. Vérifier `NEXTAUTH_URL=https://louetonmatos.fr` (exactement le domaine public)
8. `git pull` / rebuild + `pm2 restart louetonmatos`

---

## Messagerie (prod)

La messagerie **fonctionne sans Pusher** (rafraîchissement automatique toutes les ~3 s).

Pour le temps réel immédiat (recommandé) :

1. Créer une app [Pusher Channels](https://dashboard.pusher.com) (cluster `eu`)
2. Ajouter dans `.env.production` :

```bash
PUSHER_APP_ID=…
PUSHER_KEY=…
PUSHER_SECRET=…
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=…   # identique à PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

3. Rebuild + restart PM2 (`git pull` ou `./deploy/pm2-deploy.sh`)

Prérequis métier : seuls les **membres ACTIVE** (rôle MEMBER/ADMIN) peuvent envoyer des messages (`/dashboard/messages`).

---

## Docker

L’ancien flux Docker (`deploy/deploy.sh`, `docker-compose.prod.yml`) reste disponible si besoin, mais **le flux recommandé PM2** est `./deploy/pm2-deploy.sh`.
