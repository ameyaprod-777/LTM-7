# Migrations Prisma — LoueTonMatos

Historique aligné sur le schéma actuel (Stripe Identity, sans upload KYC local).

---

## Historique

| Migration | Contenu |
|-----------|---------|
| `20260101000000_init` | Schéma initial (sans KYC fichier) |
| `20260808120000_stripe_identity_booking_completion` | Stripe Identity + `Booking.renterCompletedAt` |

---

## Déploiement prod (serveur neuf)

```bash
# Dans deploy/deploy.sh (déjà intégré)
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
```

Ou en local contre PostgreSQL :

```bash
npm run db:migrate:deploy
```

Vérifier :

```bash
npx prisma migrate status
```

---

## Dev local — vous avez utilisé `db push`

Si votre base locale est déjà synchronisée (`prisma db push`) et **n’a pas** `_prisma_migrations` :

```bash
npm run db:baseline
npx prisma migrate status   # doit afficher "Database schema is up to date"
```

Ensuite, **ne plus utiliser** `db push` en routine — préférez :

```bash
npm run db:migrate          # créer une nouvelle migration en dev
npm run db:migrate:deploy   # appliquer en prod
```

---

## Nouvelle migration (changement de schéma)

1. Modifier `prisma/schema.prisma`
2. `npm run db:migrate` → nom explicite (ex. `add_foo_field`)
3. Committer le dossier `prisma/migrations/…`
4. Prod : `npm run db:migrate:deploy` via `deploy.sh`

---

## Reset complet (dev uniquement)

```bash
npm run db:reset          # Docker + push + seed
npm run db:baseline       # si vous repassez en mode migrate
```

Admin seul :

```bash
npm run db:reset:admin
npm run db:baseline
```

---

## Dépannage

| Erreur | Cause | Action |
|--------|--------|--------|
| `column already exists` | Migration 2 rejouée | Vérifier `migrate status`, baseliner si OK |
| Checksum mismatch sur `init` | Fichier migration modifié après apply | `npm run db:sync-checksums` |
| `migrate deploy` échoue en prod | DB vide vs migrations | Logs `docker compose logs app`, vérifier `DATABASE_URL` |

---

*Dernière mise à jour : août 2026*
