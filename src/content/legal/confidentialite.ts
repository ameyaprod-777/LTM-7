import type { LegalPublisher } from "@/lib/legal-config";
import type { LegalDocument } from "@/content/legal/types";

export function getPrivacyDocument(p: LegalPublisher): LegalDocument {
  return {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    description: `Comment ${p.platformName} collecte et protège vos données personnelles (RGPD).`,
    sections: [
      {
        id: "responsable",
        title: "1. Responsable de traitement",
        paragraphs: [
          `Le responsable du traitement est ${p.companyName} (${p.legalForm}), ${p.address}.`,
          `Contact données personnelles : ${p.dpoEmail} — contact général : ${p.email}.`,
        ],
      },
      {
        id: "donnees",
        title: "2. Données collectées",
        paragraphs: [
          `Nous traitons notamment : identité et coordonnées (nom, email, ville), profil créatif, contenus publiés (annonces, messages, actu), données de réservation et de paiement (via prestataire), pièces KYC, logs techniques et cookies (voir Politique cookies).`,
        ],
        bullets: [
          "Données de compte et d'authentification",
          "Candidature d'adhésion et documents KYC",
          "Annonces, services, messages, avis",
          "Historique de réservations et notifications",
          "Données de géolocalisation approximative (carte des annonces) si renseignées",
        ],
      },
      {
        id: "finalites",
        title: "3. Finalités et bases légales",
        paragraphs: [
          `Les traitements ont pour finalités : gestion des comptes et de l'adhésion, mise en relation, exécution des réservations, sécurité et lutte contre la fraude, support, amélioration du service, obligations légales.`,
        ],
        bullets: [
          "Exécution du contrat / mesures précontractuelles (compte, location)",
          "Intérêt légitime (sécurité, modération, amélioration)",
          "Obligation légale (conservation comptable, réquisitions)",
          "Consentement (cookies non essentiels, communications marketing le cas échéant)",
        ],
      },
      {
        id: "destinataires",
        title: "4. Destinataires et sous-traitants",
        paragraphs: [
          `Les données peuvent être accessibles aux équipes habilitées de ${p.platformName}, aux autres membres dans la limite des fonctionnalités (profil public, messagerie liée à une réservation), et à nos sous-traitants : hébergement (${p.hostName}), base de données, envoi d'emails, paiement (Stripe), stockage sécurisé des pièces KYC.`,
          `Une liste actualisée des sous-traitants peut être obtenue sur demande à ${p.dpoEmail}.`,
        ],
      },
      {
        id: "duree",
        title: "5. Durées de conservation",
        paragraphs: [
          `Compte actif : durée de l'inscription + 3 ans après dernière activité (prospection / preuve).`,
          `Données de facturation : 10 ans. Logs techniques : jusqu'à 12 mois.`,
          `Pièces KYC : voir Politique KYC (conservation limitée à l'examen et obligations légales).`,
        ],
      },
      {
        id: "droits",
        title: "6. Vos droits",
        paragraphs: [
          `Conformément au RGPD, vous disposez des droits d'accès, rectification, effacement, limitation, opposition, portabilité (le cas échéant) et du droit de retirer votre consentement.`,
          `Pour les exercer : ${p.dpoEmail}. Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
        ],
      },
      {
        id: "securite",
        title: "7. Sécurité",
        paragraphs: [
          `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (chiffrement des échanges, contrôle d'accès, mots de passe hashés, stockage restreint des pièces d'identité). Aucun système n'étant infaillible, nous vous invitons à protéger vos identifiants.`,
        ],
      },
      {
        id: "transferts",
        title: "8. Transferts hors UE",
        paragraphs: [
          `Certains sous-traitants (hébergement, email) peuvent être situés hors Union européenne. Dans ce cas, des garanties appropriées sont mises en place (clauses contractuelles types, décisions d'adéquation).`,
        ],
      },
    ],
  };
}
