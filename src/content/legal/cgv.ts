import type { LegalPublisher } from "@/lib/legal-config";
import type { LegalDocument } from "@/content/legal/types";

export function getCgvDocument(p: LegalPublisher): LegalDocument {
  return {
    slug: "cgv",
    title: "Conditions générales de location et de services",
    description: `Conditions applicables aux locations de matériel et prestations entre membres via ${p.platformName}.`,
    sections: [
      {
        id: "champ",
        title: "1. Champ d'application",
        paragraphs: [
          `Les présentes Conditions générales (ci-après « CGV ») s'appliquent aux contrats de location de matériel audiovisuel et, le cas échéant, aux prestations de services proposées entre membres validés de ${p.platformName}.`,
          `En réservant ou en acceptant une réservation via la Plateforme, chaque partie reconnaît avoir pris connaissance des CGV, de la Charte responsabilité matériel et des CGU.`,
        ],
      },
      {
        id: "parties",
        title: "2. Identification des parties",
        paragraphs: [
          `Le « Loueur » (ou « Prestataire ») est le membre propriétaire du matériel ou fournisseur du service. Le « Locataire » (ou « Client ») est le membre qui effectue la réservation.`,
          `${p.platformName} n'est pas vendeur ni loueur du matériel, sauf mention expresse contraire.`,
        ],
      },
      {
        id: "formation",
        title: "3. Formation du contrat",
        paragraphs: [
          `La mise en ligne d'une annonce ou d'une offre de service constitue une invitation à contracter. Le contrat naît lorsque le Loueur accepte la demande de réservation (ou confirmation équivalente sur la Plateforme) et que le Locataire a validé les conditions affichées, y compris le prix, les dates et les modalités de remise.`,
        ],
      },
      {
        id: "prix",
        title: "4. Prix et paiement",
        paragraphs: [
          `Les prix sont indiqués en euros, généralement par jour de location ou selon le barème du Prestataire. Des frais de livraison, de service Plateforme (commission) ou de transaction peuvent s'ajouter et sont affichés avant validation.`,
          `Le paiement s'effectue via les moyens proposés sur la Plateforme. Le Loueur reçoit les sommes selon les modalités techniques en vigueur (virement, prestataire de paiement).`,
        ],
      },
      {
        id: "caution",
        title: "5. Absence de caution — principe de confiance",
        paragraphs: [
          `Sauf stipulation expresse contraire entre les parties sur une annonce précise, ${p.platformName} fonctionne sans dépôt de garantie (« caution ») préalable, sur la base de la confiance au sein de la communauté professionnelle et de la vérification d'identité des membres.`,
          `L'absence de caution ne diminue en aucun cas l'obligation du Locataire de restituer le matériel dans l'état convenu et de réparer les préjudices en cas de dommage, perte, vol ou utilisation non conforme, conformément à la Charte responsabilité matériel.`,
        ],
      },
      {
        id: "remise",
        title: "6. Remise, utilisation et restitution",
        paragraphs: [
          `Les modalités de retrait, livraison et restitution sont convenues entre les parties via la messagerie ou les options de l'annonce. Le Locataire s'engage à utiliser le matériel conformément à sa destination professionnelle, avec diligence et dans le respect des notices du fabricant.`,
          `Un état des lieux contradictoire (photos, checklist) est fortement recommandé à la remise et au retour.`,
        ],
        bullets: [
          "Vérifier le bon fonctionnement et l'état apparent à la réception",
          "Signaler immédiatement toute anomalie au Loueur et sur la Plateforme",
          "Ne pas sous-louer ni céder le matériel sans accord écrit du Loueur",
          "Restituer aux dates convenues, aux mêmes accessoires et emballages",
        ],
      },
      {
        id: "dommages",
        title: "7. Dommages, casse et vol",
        paragraphs: [
          `En cas de détérioration, panne imputable au Locataire, perte, vol ou retard de restitution, le Locataire s'engage à indemniser le Loueur du préjudice subi (réparation, remplacement, frais de location de substitution, frais logistiques).`,
          `Les modalités de constat, de chiffrage et de règlement sont détaillées dans la Charte responsabilité matériel. ${p.platformName} peut, à la demande d'une partie et dans la limite de ses moyens, faciliter la médiation et le recouvrement, sans se substituer aux obligations contractuelles des membres.`,
        ],
      },
      {
        id: "annulation",
        title: "8. Annulation",
        paragraphs: [
          `Les conditions d'annulation peuvent être précisées sur l'annonce ou convenues entre parties. À défaut, une annulation tardive peut donner lieu à indemnisation du Loueur pour les jours réservés ou les frais engagés, dans le respect du droit applicable.`,
          `Les remboursements via prestataire de paiement sont traités selon les règles techniques et bancaires en vigueur.`,
        ],
      },
      {
        id: "services",
        title: "9. Prestations de services",
        paragraphs: [
          `Les prestations (pilote drone, chef opérateur, montage, etc.) font l'objet d'un contrat entre le Prestataire et le Client. Le périmètre, les droits d'image, les délais et la propriété des livrables doivent être précisés entre les parties.`,
        ],
      },
      {
        id: "litiges",
        title: "10. Litiges entre membres",
        paragraphs: [
          `Les parties privilégient le règlement amiable via la messagerie et, si nécessaire, le support ${p.platformName}. En cas d'échec, elles peuvent saisir les juridictions compétentes selon le droit français.`,
          `Contact : ${p.email}.`,
        ],
      },
    ],
  };
}
