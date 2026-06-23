import type { LegalPublisher } from "@/lib/legal-config";
import type { LegalDocument } from "@/content/legal/types";

export function getCookiesDocument(p: LegalPublisher): LegalDocument {
  return {
    slug: "cookies",
    title: "Politique cookies",
    description: `Informations sur les traceurs utilisés par ${p.platformName}.`,
    sections: [
      {
        id: "definition",
        title: "1. Qu'est-ce qu'un cookie ?",
        paragraphs: [
          `Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site. Des traceurs similaires (localStorage, pixels) peuvent être utilisés pour des finalités équivalentes.`,
        ],
      },
      {
        id: "essentiels",
        title: "2. Cookies strictement nécessaires",
        paragraphs: [
          `Ces cookies sont indispensables au fonctionnement du site. Ils ne nécessitent pas votre consentement préalable (recommandation CNIL).`,
        ],
        bullets: [
          "Cookie de session d'authentification (connexion sécurisée via NextAuth)",
          "Cookie de préférence de consentement cookies (ltm-cookie-consent)",
          "Sécurité et équilibrage de charge",
        ],
      },
      {
        id: "optionnels",
        title: "3. Cookies soumis à consentement",
        paragraphs: [
          `À ce jour, ${p.platformName} ne dépose pas de cookies publicitaires ni de mesure d'audience tiers sans votre accord. Si de tels outils sont activés ultérieurement (ex. analytics), cette politique sera mise à jour et votre consentement sera recueilli via le bandeau cookies.`,
        ],
      },
      {
        id: "gestion",
        title: "4. Gérer vos choix",
        paragraphs: [
          `Vous pouvez à tout moment modifier votre choix en supprimant le cookie de consentement dans les paramètres de votre navigateur ou en cliquant sur « Gérer les cookies » en bas de page lorsque disponible.`,
          `Pour paramétrer votre navigateur : consultez l'aide de Chrome, Firefox, Safari ou Edge.`,
        ],
      },
      {
        id: "duree",
        title: "5. Durée de conservation",
        paragraphs: [
          `Le consentement cookies est conservé 13 mois maximum. Les cookies de session expirent à la fermeture du navigateur ou selon la durée technique du fournisseur d'authentification.`,
        ],
      },
      {
        id: "contact",
        title: "6. Contact",
        paragraphs: [
          `Questions : ${p.dpoEmail} ou ${p.email}.`,
        ],
      },
    ],
  };
}
