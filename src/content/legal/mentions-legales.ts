import type { LegalPublisher } from "@/lib/legal-config";
import type { LegalDocument } from "@/content/legal/types";

export function getMentionsLegalesDocument(p: LegalPublisher): LegalDocument {
  const rcsLine = p.rcs
    ? `Immatriculation : ${p.rcs}.`
    : "Immatriculation RCS : [à compléter].";

  return {
    slug: "mentions-legales",
    title: "Mentions légales",
    description: `Informations légales obligatoires concernant ${p.platformName}.`,
    sections: [
      {
        id: "editeur",
        title: "1. Éditeur du site",
        paragraphs: [
          `Site : ${p.websiteUrl}`,
          `Éditeur : ${p.companyName} — ${p.legalForm}`,
          `Siège social : ${p.address}`,
          `SIRET : ${p.siret}`,
          rcsLine,
          `Capital social : ${p.shareCapital}`,
          `Directeur de la publication : ${p.director}`,
          `Contact : ${p.email}`,
        ],
      },
      {
        id: "hebergeur",
        title: "2. Hébergeur",
        paragraphs: [
          `Hébergeur : ${p.hostName}`,
          `Adresse : ${p.hostAddress}`,
        ],
      },
      {
        id: "propriete",
        title: "3. Propriété intellectuelle",
        paragraphs: [
          `L'ensemble du site ${p.platformName} (textes, graphismes, logo, structure) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation non autorisée est interdite.`,
        ],
      },
      {
        id: "donnees",
        title: "4. Données personnelles et cookies",
        paragraphs: [
          `Pour le traitement des données personnelles, consultez la Politique de confidentialité et la Politique cookies.`,
          `Délégué ou contact données : ${p.dpoEmail}.`,
        ],
      },
      {
        id: "signalement",
        title: "5. Signalement de contenus illicites",
        paragraphs: [
          `Conformément à la réglementation applicable, vous pouvez signaler tout contenu illicite ou contraire aux CGU à : ${p.email}, en précisant l'URL concernée et les motifs du signalement.`,
        ],
      },
      {
        id: "mediation",
        title: "6. Médiation de la consommation",
        paragraphs: [
          `En cas de litige avec un consommateur, une médiation peut être engagée conformément aux articles L.612-1 et suivants du Code de la consommation. [Médiateur de la consommation à désigner avant ouverture publique si applicable.]`,
        ],
      },
    ],
  };
}
