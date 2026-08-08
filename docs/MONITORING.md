# Monitoring — LoueTonMatos

Guide pour activer **Sentry** (erreurs) et **healthchecks** (disponibilité) en bêta / prod.

---

## 1. Healthchecks

| Endpoint | Usage | Réponse |
|----------|--------|---------|
| `GET /api/health` | **Readiness** — UptimeRobot, Docker, Nginx | `200` si DB OK, `503` si DB down |
| `GET /api/health/live` | **Liveness** — process Node vivant | Toujours `200` |

Exemple de réponse `/api/health` :

```json
{
  "status": "ok",
  "timestamp": "2026-08-08T…",
  "version": "0.1.0",
  "environment": "production",
  "uptimeSeconds": 3600,
  "checks": {
    "database": { "status": "ok", "latencyMs": 4 },
    "stripe": { "status": "ok", "configured": true },
    "email": { "status": "ok", "configured": true }
  }
}
```

- `status: "degraded"` = app up, mais Stripe ou Resend non configurés (normal en staging).
- `status: "error"` + HTTP **503** = base de données inaccessible.

### UptimeRobot / Better Stack

1. Créer un monitor **HTTP(s)** sur `https://votre-domaine.fr/api/health`
2. Intervalle : 5 min
3. Alerte si status ≠ 200 ou timeout > 30 s

### Docker

Le conteneur `app` dans `docker-compose.prod.yml` ping `/api/health` toutes les 30 s.

Test local :

```bash
curl -s http://localhost:3000/api/health | jq
```

Sur le VPS (port hôte Docker) :

```bash
curl -s http://127.0.0.1:3007/api/health | jq
```

---

## 2. Sentry (erreurs)

### Création du projet

1. [sentry.io](https://sentry.io) → New Project → **Next.js**
2. Copier le **DSN** dans `.env.production` :

```env
SENTRY_DSN=https://…@….ingest.sentry.io/…
NEXT_PUBLIC_SENTRY_DSN=https://…@….ingest.sentry.io/…
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=abc1234
SENTRY_TRACES_SAMPLE_RATE=0.2
```

3. Redémarrer l’app.

Sans DSN, Sentry **ne s’initialise pas** (pas de bruit en dev).

### Vérifier que ça marche

En staging uniquement, déclencher une erreur test côté serveur (ex. route temporaire) ou attendre une vraie 500 — l’événement apparaît dans Sentry sous l’environnement `production`.

### Source maps (optionnel)

Pour des stack traces lisibles en prod :

```env
SENTRY_ORG=votre-org
SENTRY_PROJECT=louetonmatos
SENTRY_AUTH_TOKEN=sntrys_…
```

Puis build avec ces variables (voir `next.config.mjs` + `@sentry/nextjs`).

### Session Replay

Activé côté client (`replaysOnErrorSampleRate: 1`) avec texte masqué (RGPD).

---

## 3. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `instrumentation.ts` | Charge Sentry serveur / edge au démarrage |
| `sentry.*.config.ts` | Init Sentry (client, server, edge) |
| `src/lib/sentry-config.ts` | DSN, environment, release, sample rates |
| `src/app/global-error.tsx` | Capture erreurs React globales |
| `src/lib/health-check.ts` | Logique checks DB / Stripe / email |
| `src/app/api/health/route.ts` | Endpoint readiness |
| `deploy/deploy.sh` | Vérifie `/api/health` après deploy |

---

## 4. Checklist bêta

- [ ] `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` en prod
- [ ] `SENTRY_ENVIRONMENT=production`
- [ ] Monitor uptime sur `/api/health`
- [ ] Test : couper PostgreSQL → `/api/health` retourne 503
- [ ] Test : erreur volontaire visible dans Sentry
- [ ] `deploy.sh` affiche « OK — /api/health répond »

---

*Dernière mise à jour : août 2026*
