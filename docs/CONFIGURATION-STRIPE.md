# Configuration Stripe — LoueTonMatos

Ce guide explique comment obtenir vos clés API Stripe, configurer les webhooks et activer les paiements dans l’application LoueTonMatos (locations, prestations de services, virements aux loueurs).

---

## Sommaire

1. [À quoi sert Stripe dans l’application](#1-à-quoi-sert-stripe-dans-lapplication)
2. [Créer un compte Stripe](#2-créer-un-compte-stripe)
3. [Récupérer les clés API (mode Test)](#3-récupérer-les-clés-api-mode-test)
4. [Variables d’environnement](#4-variables-denvironnement)
5. [Webhooks](#5-webhooks)
6. [Stripe Connect (virements aux loueurs)](#6-stripe-connect-virements-aux-loueurs)
7. [Tester les paiements en local](#7-tester-les-paiements-en-local)
8. [Passer en production (mode Live)](#8-passer-en-production-mode-live)
9. [Dépannage](#9-dépannage)
10. [Référence technique](#10-référence-technique)

---

## 1. À quoi sert Stripe dans l’application

| Fonctionnalité | Comportement |
|----------------|--------------|
| **Réservations (locations)** | Le locataire paie par **Stripe Checkout** (carte). Après paiement, le webhook confirme la réservation (`CONFIRMED`) et enregistre le paiement (`HELD`). |
| **Prestations (devis services)** | Le client peut payer un devis accepté par carte (même flux Checkout + webhook). |
| **Annulation** | Remboursement carte via `stripe.refunds.create` si un `payment_intent` est enregistré. |
| **Fin de location** | Libération des fonds au loueur : statut `RELEASED` en base ; **virement Stripe** uniquement si **Stripe Connect** est activé. |
| **Loueurs / prestataires** | Onboarding **Stripe Connect Express** depuis `/dashboard/settings/payments` pour recevoir les virements. |

Sans clé `STRIPE_SECRET_KEY` :

- En **développement** : les réservations peuvent être confirmées **sans paiement réel** si `ALLOW_DEV_BOOKING_WITHOUT_PAYMENT=true` (valeur par défaut recommandée en local).
- En **production** : les réservations payantes sont **refusées** tant que Stripe n’est pas configuré.

> **Important** : ne jamais déployer en production avec `ALLOW_DEV_BOOKING_WITHOUT_PAYMENT=true` et sans Stripe — cela permettrait des réservations sans encaissement.

---

## 2. Créer un compte Stripe

1. Rendez-vous sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2. Créez un compte avec l’email de votre société (ex. `contact@louetonmatos.fr`).
3. Complétez les informations légales (SIRET, IBAN, identité du représentant) — obligatoire pour le mode **Live**, recommandé tôt pour éviter les blocages.
4. Restez en **mode Test** (interrupteur « Test mode » activé en haut à droite du Dashboard) tant que vous développez.

---

## 3. Récupérer les clés API (mode Test)

1. Dashboard Stripe → **Developers** → **API keys**.
2. Copiez :
   - **Secret key** → commence par `sk_test_...` → variable `STRIPE_SECRET_KEY`
   - **Publishable key** → commence par `pk_test_...` → variables `STRIPE_PUBLISHABLE_KEY` et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

> La clé **secrète** ne doit **jamais** être commitée dans Git, exposée côté navigateur ou partagée publiquement. En cas de fuite : **révoquez** la clé dans le Dashboard et créez-en une nouvelle.

La clé publique (`pk_test_...`) est prévue pour une future intégration frontend (Elements). Aujourd’hui, l’app utilise surtout **Stripe Checkout** (redirection) : seule la clé secrète est indispensable pour créer les sessions.

---

## 4. Variables d’environnement

Copiez `.env.example` vers `.env` (local) ou configurez les variables sur votre hébergeur (Vercel, OVH, etc.).

```env
# --- Stripe (obligatoire pour les paiements en ligne) ---
STRIPE_SECRET_KEY="sk_test_xxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxx"

# Virements automatiques aux loueurs (Stripe Connect Express)
STRIPE_CONNECT_ENABLED="false"

# Dev uniquement : réservations sans Stripe (mettre "false" pour tester le vrai flux paiement)
ALLOW_DEV_BOOKING_WITHOUT_PAYMENT="true"
```

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `STRIPE_SECRET_KEY` | Oui (si paiement) | Clé secrète serveur. Active Checkout, remboursements, Connect. |
| `STRIPE_PUBLISHABLE_KEY` | Recommandé | Clé publique (réserve frontend). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Recommandé | Même valeur que `STRIPE_PUBLISHABLE_KEY`, exposée au navigateur si besoin. |
| `STRIPE_WEBHOOK_SECRET` | Oui (si paiement) | Secret de signature des webhooks (`whsec_...`). |
| `STRIPE_CONNECT_ENABLED` | Non | `"true"` pour activer l’onboarding Connect et les `transfers` vers les loueurs. |
| `ALLOW_DEV_BOOKING_WITHOUT_PAYMENT` | Dev | `"true"` = réservations confirmées sans carte en local. **`false` en prod.** |
| `NEXTAUTH_URL` | Oui | URL de base pour les `success_url` / `cancel_url` Checkout (ex. `http://localhost:3000` ou `https://louetonmatos.fr`). |

Après toute modification du `.env`, **redémarrez** le serveur :

```bash
# Arrêter npm run dev (Ctrl+C) puis :
npm run dev
```

---

## 5. Webhooks

Stripe notifie l’application quand un paiement réussit, échoue, est remboursé, ou quand un compte Connect est mis à jour.

**Endpoint de l’application** : `POST /api/stripe/webhook`

### 5.1 Événements à écouter

Dans le Dashboard Stripe → **Developers** → **Webhooks** → **Add endpoint**, sélectionnez au minimum :

| Événement | Rôle dans LoueTonMatos |
|-----------|-------------------------|
| `checkout.session.completed` | Confirme réservation ou paiement devis ; enregistre `payment_intent` |
| `payment_intent.payment_failed` | Marque le paiement en `FAILED` |
| `charge.refunded` | Met à jour le remboursement en base |
| `account.updated` | Met à jour `stripeChargesEnabled` / `stripePayoutsEnabled` du loueur |

### 5.2 Webhook en production

1. **Developers** → **Webhooks** → **Add endpoint**
2. URL : `https://louetonmatos.fr/api/stripe/webhook` (remplacez par votre domaine)
3. Sélectionnez les événements ci-dessus
4. Après création, ouvrez l’endpoint → **Signing secret** → copiez `whsec_...` dans `STRIPE_WEBHOOK_SECRET`
5. Redéployez / redémarrez l’application

### 5.3 Webhook en local (Stripe CLI)

Les webhooks du Dashboard pointent vers une URL publique. En local, utilisez la [Stripe CLI](https://stripe.com/docs/stripe-cli) :

```bash
# Installation (macOS)
brew install stripe/stripe-cli/stripe

# Connexion à votre compte
stripe login

# Transmettre les événements vers votre app locale
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

La CLI affiche un secret du type `whsec_...` — copiez-le dans `.env` comme `STRIPE_WEBHOOK_SECRET`, puis redémarrez `npm run dev`.

Dans un autre terminal, vous pouvez déclencher un événement de test :

```bash
stripe trigger checkout.session.completed
```

Pour un test réaliste, effectuez plutôt une vraie réservation avec une carte test (voir section 7).

---

## 6. Stripe Connect (virements aux loueurs)

Par défaut, les paiements arrivent sur le **compte Stripe de la plateforme**. Pour virer automatiquement la part du loueur à la fin d’une location :

### 6.1 Activer Connect dans Stripe

1. Dashboard → **Connect** → **Get started**
2. Choisissez le modèle adapté (souvent **Platform** avec comptes **Express** pour les loueurs)
3. Complétez les paramètres de la plateforme (CGV, politique de confidentialité, support)

### 6.2 Activer dans l’application

```env
STRIPE_CONNECT_ENABLED="true"
```

Redémarrez l’application.

### 6.3 Parcours loueur

1. Le loueur se connecte → **Paramètres** → **Paiements & virements** (`/dashboard/settings/payments`)
2. Il clique sur **Configurer mes paiements** → redirection Stripe (identité, IBAN)
3. Au retour, le webhook `account.updated` met à jour les flags `charges_enabled` / `payouts_enabled`
4. À la **clôture** d’une réservation, l’admin ou le flux métier appelle la libération des fonds ; un `transfer` est créé vers `stripeAccountId` du loueur si Connect est actif

**Commission plateforme** : réglée dans l’admin (`/admin/settings`, taux par défaut 12 %). Les montants nets loueur sont calculés avant le transfer.

> Les prestations de services peuvent aussi être payées en **espèces** (hors Stripe) selon le parcours métier ; Connect concerne surtout les **locations** et les paiements carte des devis.

---

## 7. Tester les paiements en local

### 7.1 Préparer l’environnement

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."   # depuis stripe listen
ALLOW_DEV_BOOKING_WITHOUT_PAYMENT="false"   # pour forcer le vrai paiement
NEXTAUTH_URL="http://localhost:3000"
```

Terminal 1 : `npm run dev`  
Terminal 2 : `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### 7.2 Cartes de test Stripe

| Numéro | Résultat |
|--------|----------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Carte refusée |
| `4000 0025 0000 3155` | Authentification 3D Secure |

- Date d’expiration : toute date future (ex. `12/34`)
- CVC : trois chiffres quelconques (ex. `123`)
- Code postal : quelconque

Liste complète : [Cartes de test Stripe](https://docs.stripe.com/testing#cards)

### 7.3 Scénario — Location

1. Compte **membre** : créer ou utiliser une annonce
2. Autre compte : demander une réservation
3. **Loueur** : accepter la demande dans **Réservations**
4. **Locataire** : payer via le bouton qui ouvre **Stripe Checkout**
5. Vérifier :
   - Redirection vers la messagerie avec `?paid=1`
   - Dashboard Stripe → **Payments** : paiement visible
   - Base : réservation `CONFIRMED`, paiement `HELD`
   - Logs du `stripe listen` : `checkout.session.completed` reçu

### 7.4 Scénario — Prestation (devis)

1. Client : demander un devis sur une fiche service
2. Prestataire : accepter et fixer un montant
3. Client : choisir **Payer par carte** → Checkout
4. Webhook : `serviceQuotePayment` en `HELD`, notifications client / prestataire

### 7.5 Scénario — Connect (optionnel)

1. `STRIPE_CONNECT_ENABLED="true"`
2. Compte loueur → `/dashboard/settings/payments` → compléter l’onboarding Stripe (données test)
3. Terminer une location et libérer les fonds (selon votre parcours admin / loueur)

---

## 8. Passer en production (mode Live)

Checklist avant d’accepter de vrais paiements :

- [ ] Compte Stripe **activé** (vérification identité / entreprise terminée)
- [ ] Passer le Dashboard en **mode Live** (désactiver « Test mode »)
- [ ] Remplacer les clés par `sk_live_...` et `pk_live_...`
- [ ] Créer un **nouveau** endpoint webhook en Live : `https://louetonmatos.fr/api/stripe/webhook`
- [ ] Mettre à jour `STRIPE_WEBHOOK_SECRET` avec le secret **Live**
- [ ] `ALLOW_DEV_BOOKING_WITHOUT_PAYMENT="false"` (ou variable absente)
- [ ] `NODE_ENV=production`
- [ ] `NEXTAUTH_URL` et `NEXT_PUBLIC_SITE_URL` = URL HTTPS réelle
- [ ] CGV / mentions légales à jour (flux de paiement, commission, remboursements)
- [ ] Tester un petit montant réel puis un remboursement

Fichier de référence déploiement : `deploy/.env.production.example`

---

## 9. Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| « Paiements en ligne non activés » | Pas de `STRIPE_SECRET_KEY` ou serveur non redémarré | Vérifier `.env`, redémarrer `npm run dev` |
| Réservation reste `PENDING` après paiement | Webhook non reçu ou mauvais secret | Vérifier `stripe listen` ou endpoint prod ; `STRIPE_WEBHOOK_SECRET` |
| Erreur « Signature invalide » | Secret webhook incorrect ou body modifié | Nouveau secret depuis Dashboard / CLI |
| Checkout OK mais pas de confirmation | Événement `checkout.session.completed` non abonné | Ajouter l’événement sur l’endpoint webhook |
| Remboursement non sur la carte | `stripePaymentId` encore un id de **session** (`cs_...`) au lieu de `pi_...` | Le webhook doit avoir tourné après paiement ; annuler après confirmation |
| Connect : pas de virement | `STRIPE_CONNECT_ENABLED` pas à `true` ou loueur non onboardé | Vérifier `/dashboard/settings/payments` |
| En local, réservation sans payer | `ALLOW_DEV_BOOKING_WITHOUT_PAYMENT=true` | Mettre à `false` pour tester Stripe |

Logs utiles :

- Terminal Next.js : `[payment-service]` en cas d’échec refund / transfer
- Dashboard Stripe → **Developers** → **Events** : détail de chaque webhook et erreur HTTP renvoyée par l’app

---

## 10. Référence technique

### Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `src/lib/stripe.ts` | Client Stripe (si `STRIPE_SECRET_KEY` présent) |
| `src/lib/stripe-config.ts` | `stripeEnabled()`, `stripeConnectEnabled()`, mode dev sans paiement |
| `src/lib/payment-service.ts` | Sessions Checkout, remboursements, transfers Connect |
| `src/app/api/stripe/webhook/route.ts` | Traitement des événements Stripe |
| `src/app/api/stripe/connect/onboarding/route.ts` | Création compte Connect + lien onboarding |
| `src/app/api/bookings/[id]/checkout/route.ts` | Checkout réservation |
| `src/app/api/services/quotes/[id]/checkout/route.ts` | Checkout devis prestation |
| `src/components/settings/payments-settings.tsx` | UI onboarding loueur |

### Métadonnées Checkout

- Réservation : `metadata.bookingId`
- Devis service : `metadata.serviceQuoteId`

### Documentation Stripe officielle

- [Clés API](https://docs.stripe.com/keys)
- [Checkout](https://docs.stripe.com/checkout)
- [Webhooks](https://docs.stripe.com/webhooks)
- [Connect Express](https://docs.stripe.com/connect/express-accounts)
- [Stripe CLI](https://docs.stripe.com/stripe-cli)

### Autres intégrations (hors Stripe)

| Service | Guide / fichier |
|---------|-----------------|
| Email (Resend) | Variables `RESEND_API_KEY`, `EMAIL_FROM` dans `.env.example` ; test dans **Paramètres** → email de test |
| Base de données | `README.md` — Docker PostgreSQL |
| Lancement bêta (vue globale) | `docs/GUIDE-LANCEMENT-BETA.md` — Phase 6 |
| Écarts fonctionnels | `docs/GAPS-APPLICATION.md` |

---

*Dernière mise à jour : mai 2026 — aligné sur le code LoueTonMatos (Checkout, Connect Express, locations + devis services).*
