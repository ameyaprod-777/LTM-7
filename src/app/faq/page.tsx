import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Questions fréquentes sur LoueTonMatos : adhésion, locations, paiements et support.",
};

const FAQ_ITEMS = [
  {
    q: "Qu'est-ce que LoueTonMatos ?",
    a: "Une plateforme de location de matériel audiovisuel entre créatifs professionnels (cinéma, photo, son…). L'accès est réservé aux membres validés après candidature.",
  },
  {
    q: "Comment rejoindre la communauté ?",
    a: "Créez un compte, complétez votre candidature avec les pièces KYC demandées, puis attendez la validation par notre équipe. Vous pouvez aussi être invité par un membre existant.",
  },
  {
    q: "Comment louer du matériel ?",
    a: "Parcourez les annonces, choisissez vos dates, envoyez une demande au loueur puis réglez en ligne par carte (Stripe) une fois la réservation approuvée.",
  },
  {
    q: "Comment proposer mon matériel ?",
    a: "Depuis votre tableau de bord, créez une annonce avec photos, tarifs et disponibilités. Vous gérez les demandes et approuvez les réservations avant paiement.",
  },
  {
    q: "Les paiements sont-ils sécurisés ?",
    a: "Oui. Les paiements par carte passent par Stripe. Les fonds sont gérés selon le parcours de réservation (encaissement, remboursement en cas d'annulation selon la politique choisie).",
  },
  {
    q: "Puis-je annuler une réservation ?",
    a: "Oui, selon la politique d'annulation de l'annonce (flexible, modérée ou stricte). Le montant remboursé dépend du délai avant le début de la location.",
  },
  {
    q: "Où voir l'annuaire des membres ?",
    a: "Une fois membre validé, l'annuaire est accessible depuis votre tableau de bord (menu « Membres »).",
  },
  {
    q: "Un problème sur une location ?",
    a: "Utilisez la messagerie liée à la réservation, déclarez un sinistre depuis vos réservations si besoin, ou ouvrez un ticket dans Support (tableau de bord).",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-muted text-accent">
          <HelpCircle className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-anthracite">
            Questions fréquentes
          </h1>
          <p className="mt-2 text-anthracite-500">
            Tout ce qu&apos;il faut savoir pour bien utiliser LoueTonMatos.
          </p>
        </div>
      </div>

      <ul className="mt-10 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <li key={item.q}>
            <details className="group rounded-xl border border-anthracite-100 bg-white open:shadow-sm">
              <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-anthracite marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-accent transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="border-t border-anthracite-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-anthracite-600">
                {item.a}
              </p>
            </details>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-2xl border border-anthracite-100 bg-anthracite-50 p-6 text-center">
        <p className="font-medium text-anthracite">
          Vous ne trouvez pas votre réponse ?
        </p>
        <p className="mt-1 text-sm text-anthracite-500">
          Contactez-nous via le support (membres connectés) ou consultez les
          documents légaux.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/register">
            <Button>Rejoindre la communauté</Button>
          </Link>
          <Link href="/legal">
            <Button variant="outline">Documents légaux</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
