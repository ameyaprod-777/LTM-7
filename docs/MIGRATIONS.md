# Migrations Prisma — LoueTonMatos

Historique aligné sur le schéma actuel (Stripe Identity, projets vidéo).

---

## Historique

| Migration | Contenu |
|-----------|---------|
| `20260101000000_init` | Schéma initial (sans KYC fichier) |
| `20260808120000_stripe_identity_booking_completion` | Stripe Identity + `Booking.renterCompletedAt` |
| `20260810160000_project_video_url` | `Project.videoUrl` (YouTube / Vimeo) |

---

## Déploiement prod (serveur neuf)

```bash
npm run db:migrate:deploy
```

Vérifier :

```bash
npx prisma migrate status
```

---

## Erreur P3005 — « The database schema is not empty »

La base VPS existe déjà (tables créées via `db push` ou install manuel),
mais Prisma n’a pas d’historique `_prisma_migrations`.

**Sur le VPS :**

```bash
cd ~/louetonmatos
git pull
npm run db:baseline          # marque init + stripe_identity comme déjà appliquées
npx prisma migrate deploy    # applique seulement les nouvelles (ex. videoUrl)
npx prisma migrate status    # doit être OK
```

Si `videoUrl` existe déjà et `migrate deploy` dit « column already exists » :

```bash
npx prisma migrate resolve --applied 20260810160000_project_video_url
```

---

## Dev local — vous avez utilisé `db push`

Si votre base locale est déjà synchronisée (`prisma db push`) et **n’a pas** `_prisma_migrations` :

```bash
npm run db:baseline
npx prisma migrate deploy
npx prisma migrate status
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
4. Prod : `npm run db:migrate:deploy`

---

## Reset complet (dev uniquement)

```bash
npm run db:reset
npm run db:baseline
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
| **P3005** schema not empty | Pas d’historique migrate | `npm run db:baseline` puis `migrate deploy` |
| `column already exists` | Migration rejouée | `migrate resolve --applied <nom>` |
| Checksum mismatch | Fichier migration modifié | `npm run db:sync-checksums` |

---

*Dernière mise à jour : août 2026*
