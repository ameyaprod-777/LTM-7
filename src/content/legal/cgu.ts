import type { LegalPublisher } from "@/lib/legal-config";
import type { LegalDocument } from "@/content/legal/types";

export function getCguDocument(p: LegalPublisher): LegalDocument {
  return {
    slug: "cgu",
    title: "Conditions générales d'utilisation",
    description: `Règles d'accès et d'usage de la plateforme ${p.platformName}.`,
    sections: [
      {
        id: "objet",
        title: "1. Objet",
        paragraphs: [
          `Les présentes Conditions générales d'utilisation (ci-après « CGU ») régissent l'accès et l'utilisation du site et des services proposés par ${p.companyName} (${p.legalForm}), ci-après « la Plateforme » ou « ${p.platformName} », accessible à l'adresse ${p.websiteUrl}.`,
          `${p.platformName} est une place de mise en relation entre professionnels et créatifs du secteur audiovisuel pour la location de matériel, la prestation de services et l'échange au sein d'une communauté vérifiée.`,
          `L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU, des Conditions générales de location et de vente de services (CGV), de la Politique de confidentialité, de la Politique KYC et de la Charte responsabilité matériel.`,
        ],
      },
      {
        id: "acces",
        title: "2. Accès et adhésion",
        paragraphs: [
          `L'accès à certaines fonctionnalités (publication d'annonces, réservation, messagerie, fil d'actualité, annuaire membres, carte) est réservé aux utilisateurs dont la candidature a été validée par l'équipe ${p.platformName}, après vérification d'identité (KYC) et examen du profil.`,
          `La Plateforme se réserve le droit de refuser, suspendre ou résilier un compte en cas de manquement aux CGU, de fraude, de comportement préjudiciable à la communauté ou de fourniture d'informations inexactes.`,
        ],
      },
      {
        id: "comptes",
        title: "3. Comptes utilisateurs",
        paragraphs: [
          `L'utilisateur s'engage à fournir des informations exactes, à jour et complètes. Il est seul responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son compte.`,
          `Il s'interdit de créer plusieurs comptes, d'usurper l'identité d'un tiers ou d'utiliser la Plateforme à des fins illicites, commerciales non autorisées ou contraires à l'éthique professionnelle du secteur.`,
        ],
      },
      {
        id: "contenus",
        title: "4. Contenus publiés",
        paragraphs: [
          `Les annonces, services, messages, publications sur le fil d'actualité et tout contenu publié par l'utilisateur restent sous sa responsabilité. Il garantit disposer des droits nécessaires (notamment sur les visuels et descriptions) et que le matériel proposé est conforme à la réglementation.`,
          `${p.platformName} peut modérer, retirer ou refuser tout contenu non conforme, trompeur, offensant ou portant atteinte aux droits de tiers, sans préavis.`,
          `L'utilisateur accorde à ${p.platformName} une licence non exclusive, gratuite et mondiale d'hébergement et d'affichage de ses contenus pour les besoins du service.`,
        ],
      },
      {
        id: "role",
        title: "5. Rôle de la Plateforme",
        paragraphs: [
          `${p.platformName} agit en qualité d'intermédiaire technique de mise en relation. Sauf mention contraire, elle n'est pas partie aux contrats de location ou de prestation conclus entre membres.`,
          `La Plateforme peut toutefois faciliter les échanges (messagerie, paiement, médiation en cas de litige ou de dommage matériel) dans les limites décrites dans les CGV et la Charte responsabilité matériel.`,
        ],
      },
      {
        id: "paiements",
        title: "6. Paiements et commissions",
        paragraphs: [
          `Les transactions financières peuvent être traitées via un prestataire de paiement sécurisé (ex. Stripe). Des frais de service ou commissions peuvent être prélevés selon les tarifs en vigueur affichés ou configurés par l'administration.`,
        ],
      },
      {
        id: "propriete",
        title: "7. Propriété intellectuelle",
        paragraphs: [
          `La marque ${p.platformName}, le logo, l'interface et les éléments graphiques sont la propriété de ${p.companyName} ou de ses concédants. Toute reproduction non autorisée est interdite.`,
        ],
      },
      {
        id: "responsabilite",
        title: "8. Responsabilité",
        paragraphs: [
          `${p.platformName} s'efforce d'assurer la disponibilité du service mais ne garantit pas une accessibilité ininterrompue. Sa responsabilité est limitée aux dommages directs prouvés résultant d'une faute lourde ou d'un manquement caractérisé à ses obligations légales.`,
          `La Plateforme n'est pas responsable des dommages liés à l'utilisation du matériel loué, des retards, de la qualité des prestations entre membres, ni des litiges entre utilisateurs, sous réserve de son intervention éventuelle en médiation conformément à la charte matériel.`,
        ],
      },
      {
        id: "donnees",
        title: "9. Données personnelles",
        paragraphs: [
          `Le traitement des données personnelles est décrit dans la Politique de confidentialité. Les pièces KYC font l'objet d'une politique dédiée.`,
        ],
      },
      {
        id: "modification",
        title: "10. Modification et droit applicable",
        paragraphs: [
          `${p.platformName} peut modifier les présentes CGU. Les utilisateurs seront informés en cas de changement substantiel. La poursuite de l'utilisation vaut acceptation.`,
          `Les CGU sont régies par le droit français. En cas de litige, et à défaut de résolution amiable, compétence exclusive est attribuée aux tribunaux du ressort du siège social de ${p.companyName}, sous réserve des règles impératives protectrices du consommateur le cas échéant.`,
          `Pour toute question : ${p.email}.`,
        ],
      },
    ],
  };
}
