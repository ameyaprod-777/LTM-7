import type { LegalPublisher } from "@/lib/legal-config";
import type { LegalDocument } from "@/content/legal/types";

export function getMaterialResponsibilityDocument(
  p: LegalPublisher
): LegalDocument {
  return {
    slug: "responsabilite-materiel",
    title: "Charte responsabilité matériel",
    description: `Location sans caution, confiance communautaire et engagement en cas de dommage sur ${p.platformName}.`,
    sections: [
      {
        id: "philosophie",
        title: "1. Principe : confiance plutôt que caution",
        paragraphs: [
          `${p.platformName} est une communauté professionnelle de créatifs audiovisuels. Les échanges reposent sur la confiance réciproque, la transparence des profils et la vérification d'identité (KYC), et non sur un dépôt de garantie systématique.`,
          `Par défaut, aucune caution financière n'est exigée par la Plateforme avant la location. Le Loueur et le Locataire restent libres de convenir contractuellement d'une garantie complémentaire sur une annonce ou une réservation précise, à leurs seuls frais et risques.`,
        ],
      },
      {
        id: "engagement-locataire",
        title: "2. Engagement du Locataire",
        paragraphs: [
          `En réservant du matériel via ${p.platformName}, le Locataire s'engage expressément à :`,
        ],
        bullets: [
          "Prendre soin du matériel et l'utiliser conformément à sa destination professionnelle",
          "Restituer le matériel aux date et heure convenues, complet et dans l'état reçu (usure normale exceptée)",
          "Signaler sans délai toute casse, panne, perte ou vol survenu pendant la location",
          "Régler au Loueur l'intégralité des frais de réparation, remplacement ou indemnisation en cas de dommage imputable au Locataire",
          "Coopérer de bonne foi en cas de constat contradictoire (photos, devis, factures)",
        ],
      },
      {
        id: "engagement-loueur",
        title: "3. Engagement du Loueur",
        paragraphs: [
          `Le Loueur s'engage à :`,
        ],
        bullets: [
          "Décrire fidèlement l'état et les caractéristiques du matériel",
          "Fournir un matériel en état de fonctionnement conforme à l'usage annoncé",
          "Remettre les accessoires et notices convenus",
          "Documenter l'état à la remise et à la restitution (recommandé : photos horodatées)",
        ],
      },
      {
        id: "dommages",
        title: "4. Casse, panne, perte ou vol",
        paragraphs: [
          `En cas d'incident, les parties doivent en informer l'autre partie et ${p.platformName} via la messagerie ou le support dans les meilleurs délais.`,
          `Le Locataire supporte les coûts directs liés au dommage qu'il a causé ou aux manquements à ses obligations (réparation par professionnel agréé, remplacement à valeur équivalente, frais de transport, pénalités de retard si prévues au contrat).`,
          `Les assurances personnelles ou professionnelles (multirisque, RC Pro, assurance matériel) du Locataire ou du Loueur peuvent intervenir selon les contrats souscrits ; chaque membre est invité à vérifier sa couverture avant toute location de valeur.`,
        ],
      },
      {
        id: "role-plateforme",
        title: "5. Rôle de la Plateforme en cas de litige",
        paragraphs: [
          `${p.platformName} n'est pas assureur et ne garantit pas le remboursement des dommages. Toutefois, elle peut, à sa discrétion et sans obligation de résultat :`,
        ],
        bullets: [
          "Faciliter les échanges entre les parties (messagerie, mise en relation avec le support)",
          "Conserver les éléments de réservation et de conversation utiles au règlement du différend",
          "Proposer une médiation interne pour aider à trouver un accord amiable",
          "Suspendre ou exclure un membre en cas de manquement grave ou répété",
          "Transmettre, sur réquisition légale, les informations aux autorités compétentes",
        ],
      },
      {
        id: "paiement-dommages",
        title: "6. Règlement des sommes dues",
        paragraphs: [
          `Les indemnités dues au Loueur sont d'abord réglées directement entre membres (virement, facture). À défaut d'accord sous 15 jours, le Loueur peut saisir le support ${p.email} avec les preuves (photos, devis, contrat de location).`,
          `La Plateforme pourra, le cas échéant et si les dispositifs de paiement le permettent, faciliter un paiement complémentaire ou retenir des fonds déjà encaissés dans le cadre d'une réservation, dans la limite des montants concernés et du droit applicable.`,
        ],
      },
      {
        id: "exclusion",
        title: "7. Exclusions et usure normale",
        paragraphs: [
          `L'usure normale liée à un usage professionnel conforme n'est pas à la charge du Locataire. Sont en revanche à sa charge les dommages résultant de négligence, mauvaise utilisation, modification non autorisée, sous-location non agréée ou non-restitution.`,
        ],
      },
      {
        id: "acceptation",
        title: "8. Acceptation",
        paragraphs: [
          `La validation d'une réservation sur ${p.platformName} vaut acceptation de la présente charte, des CGV et des CGU.`,
          `Pour toute question : ${p.email}.`,
        ],
      },
    ],
  };
}
