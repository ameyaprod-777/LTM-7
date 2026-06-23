import type { LegalPublisher } from "@/lib/legal-config";
import type { LegalDocument } from "@/content/legal/types";

export function getKycDocument(p: LegalPublisher): LegalDocument {
  return {
    slug: "kyc",
    title: "Politique de vérification d'identité (KYC)",
    description: `Traitement des pièces d'identité et justificatifs pour l'adhésion à ${p.platformName}.`,
    sections: [
      {
        id: "objectif",
        title: "1. Objectif",
        paragraphs: [
          `Afin de préserver la confiance au sein de la communauté ${p.platformName} et de limiter les risques de fraude, chaque candidat à l'adhésion doit fournir des pièces permettant de vérifier son identité (procédure KYC — Know Your Customer).`,
          `Cette vérification complète le profil créatif et la motivation, sans se substituer aux obligations contractuelles entre membres lors des locations.`,
        ],
      },
      {
        id: "documents",
        title: "2. Documents demandés",
        paragraphs: [
          `Selon le type de pièce choisi, peuvent être requis : carte nationale d'identité (recto/verso), passeport, permis de conduire, justificatif de domicile de moins de 3 mois, ou tout document complémentaire demandé par l'équipe de modération.`,
        ],
        bullets: [
          "Formats acceptés : JPEG, PNG, WebP, PDF",
          "Taille maximale par fichier : celle indiquée sur le formulaire",
          "Documents lisibles, non expirés, en cours de validité",
        ],
      },
      {
        id: "finalites",
        title: "3. Finalités du traitement",
        paragraphs: [
          `Les pièces sont traitées exclusivement pour : examiner la candidature, vérifier l'identité, lutter contre l'usurpation et la fraude, répondre aux obligations légales, et conserver une preuve en cas de litige grave impliquant la Plateforme.`,
        ],
      },
      {
        id: "acces",
        title: "4. Qui accède aux pièces ?",
        paragraphs: [
          `Seuls les administrateurs habilités de ${p.platformName} peuvent consulter les documents KYC, dans un environnement sécurisé. Ils ne sont pas visibles des autres membres ni sur votre profil public.`,
        ],
      },
      {
        id: "conservation",
        title: "5. Conservation et suppression",
        paragraphs: [
          `En cas de refus de candidature : les pièces sont supprimées dans un délai maximal de 30 jours après notification, sauf obligation légale contraire.`,
          `En cas d'acceptation : les pièces peuvent être conservées pendant la durée de l'adhésion et jusqu'à 1 an après clôture du compte, sauf demande de suppression anticipée compatible avec nos obligations (lutte anti-fraude, contentieux).`,
          `Vous pouvez demander la suppression ou l'accès à vos données à : ${p.dpoEmail}.`,
        ],
      },
      {
        id: "securite",
        title: "6. Sécurité",
        paragraphs: [
          `Les fichiers sont stockés de manière restreinte (accès serveur contrôlé ; en production, stockage chiffré sur infrastructure dédiée type cloud sécurisé). Les transferts utilisent le protocole HTTPS.`,
        ],
      },
      {
        id: "droits",
        title: "7. Vos droits",
        paragraphs: [
          `Vous disposez des droits prévus par le RGPD (accès, rectification, effacement, limitation, opposition). L'exercice de certains droits peut être limité lorsque le traitement est nécessaire au respect d'obligations légales ou à la constatation de droits en justice.`,
          `Réclamation possible auprès de la CNIL : www.cnil.fr.`,
        ],
      },
      {
        id: "consentement",
        title: "8. Consentement",
        paragraphs: [
          `En soumettant votre candidature et vos pièces, vous attestez sur l'honneur de l'exactitude des informations et acceptez la présente politique KYC ainsi que la Politique de confidentialité.`,
        ],
      },
    ],
  };
}
