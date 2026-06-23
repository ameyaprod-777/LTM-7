# LoueTonMatos — État produit (mise en prod)

**But** : savoir rapidement ce qui est prêt et ce qu’il reste avant la **mise en production**.

**Infra & serveur** (OVH, Docker, Nginx, backups) → [`GUIDE-LANCEMENT-BETA.md`](GUIDE-LANCEMENT-BETA.md)  
**Stripe** → [`CONFIGURATION-STRIPE.md`](CONFIGURATION-STRIPE.md)

**Dernière mise à jour** : 19 mai 2026

---

## En bref

L’application est **utilisable en local** sur tout le parcours membre (adhésion, annonces, réservations, paiements, messagerie, admin).  
Pour la **prod**, il manque surtout : **conformité (légal + RGPD)**, **durcissement prod** (Stripe, env, deploy), **tests**, et quelques **corrections ciblées**.

---

## ✅ Ce qui est fait

### Comptes
- Inscription, connexion, Google OAuth
- Mot de passe oublié / réinitialisation
- Profil, avatar, suppression de compte
- Rôles (visiteur, membre, admin) et bannissement

### Adhésion
- Candidature + upload KYC
- Validation admin (approuver, refuser, demander des pièces)
- Invitations par lien
- Purge automatique des pièces KYC (cron)

### Marketplace
- Annonces : création, édition, photos, carte, recherche, tags, dates bloquées, pause
- Services : catalogue, photos, devis, paiement carte ou espèces déclarées
- Réservations : demande → accord loueur → paiement Stripe → confirmation
- Livraisons : tâches côté loueur (`/dashboard/deliveries`)
- Annulation, remboursement, litige, libération des fonds (Stripe Connect)

### Communauté
- Fil d’actualité (forum) + modération admin
- Annuaire et profils membres
- Avis après location + modération + rappel email J+2
- Messagerie temps réel (Pusher) ou polling, pièces jointes

### Admin & support
- Panel admin : utilisateurs, candidatures, annonces, services, réservations, forum, avis, tickets, revenus, audit, zones de livraison, réglages
- Tickets support avec pièces jointes et emails

### Technique
- Pages légales (CGU, CGV, confidentialité, cookies…)
- Bandeau cookies, rate limiting, validation des uploads
- SEO de base (sitemap, robots, Open Graph)
- Docker + script de déploiement dans le repo

---

## ❌ À faire pour la mise en prod

### Bloquant — à faire avant d’ouvrir au public

| # | Sujet | Action |
|---|--------|--------|
| 1 | **Légal** | Remplir les variables `NEXT_PUBLIC_LEGAL_*` (SIRET, adresse, représentant…) et faire relire les textes par un avocat |
| 2 | ~~**RGPD**~~ | ✅ Export JSON — `GET /api/users/me/export` + bouton Paramètres |
| 3 | ~~**Email à l’inscription**~~ | ✅ Email de vérification envoyé à l’inscription ; redirection `/verify-email?sent=1` |
| 4 | **Stripe prod** | Clés Live, webhook sur le domaine prod, `ALLOW_DEV_BOOKING_WITHOUT_PAYMENT=false`, tester un paiement complet |
| 5 | **Emails** | Resend en prod (domaine vérifié) ; prévoir des emails clairs pour les réservations (pas seulement une notif générique) |
| 6 | **Base de données** | Créer les migrations Prisma (`prisma/migrations`) — le script `deploy.sh` appelle `migrate deploy` |
| 7 | **Sécurité prod** | Ne pas lancer le seed en prod (comptes démo) ; secrets forts (`NEXTAUTH_SECRET`, `CRON_SECRET`) |
| 8 | **Monitoring** | Ajouter `GET /api/health` + outil d’erreurs (ex. Sentry) |
| 9 | **Tests** | Au minimum : tests E2E du parcours critique + CI (lint + build) sur les PR |
| 10 | **Infra** | Suivre le guide : serveur, HTTPS, backups PostgreSQL, crons (`kyc-purge`, `booking-transitions`, `review-reminders`) |

### Important — idéalement avant ou juste après le lancement

| # | Sujet | Action |
|---|--------|--------|
| 11 | ~~**Bug admin**~~ | ✅ Middleware aligné sur `isStaffRole` (ADMIN + MODERATOR) |
| 12 | **KYC en prod** | Variable `UPLOAD_ROOT` documentée — monter volume + permissions en prod |
| 13 | ~~**Annuaire**~~ | ✅ Pagination 24 membres / page |
| 14 | ~~**Sinistre matériel**~~ | ✅ Formulaire dédié + ticket support + litige |
| 15 | ~~**Page offline**~~ | ✅ `/offline` |
| 16 | ~~**Annonces brouillon**~~ | ✅ Brouillon à la création + bouton Publier |

### Plus tard (pas bloquant pour une première prod)

- Tests unitaires larges, charge (k6)
- Préférences de notifications (opt-out)
- Factures PDF, caution optionnelle
- 2FA, Apple Sign-In, i18n, mode sombre, favoris
- Rate limiting Redis si plusieurs serveurs

---

## Checklist rapide mise en prod

```
Légal & RGPD
[ ] Variables légales complètes en prod
[ ] Textes relus par un avocat
[x] Export données utilisateur (RGPD)

Application
[x] Vérification email corrigée
[ ] Stripe Live + webhooks OK
[ ] ALLOW_DEV_BOOKING_WITHOUT_PAYMENT=false
[ ] Resend configuré (domaine prod)
[ ] Pas de seed / comptes démo en prod

Technique
[ ] Migrations Prisma commitées
[ ] Deploy testé sur staging
[ ] /api/health + monitoring erreurs
[ ] Crons planifiés
[ ] Backups DB testés

Qualité
[ ] Parcours manuel complet OK (inscription → réservation → paiement → avis)
[ ] Tests E2E parcours critique
[ ] CI lint + build
```

---

## Parcours à tester une dernière fois avant prod

1. S’inscrire → candidature → KYC → validation admin  
2. Créer une annonce avec photos  
3. Réserver (autre compte) → accord loueur → payer par carte test  
4. Vérifier que la réservation passe bien en « confirmée » (webhook Stripe)  
5. Messagerie entre les deux parties  
6. Clôturer la location et laisser un avis  

---

## Documents liés

| Fichier | Contenu |
|---------|---------|
| `GUIDE-LANCEMENT-BETA.md` | Déploiement, serveur, sécurité infra |
| `CONFIGURATION-STRIPE.md` | Clés, webhooks, Connect, tests carte |
| `GAPS-APPLICATION.md` | **Ce fichier** |
