import Link from "next/link";
import {
  Camera,
  Shield,
  Users,
  ArrowRight,
  Star,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccessContext } from "@/lib/session";
import { canViewListingDetails } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listings/listing-card";

const categories = [
  { label: "Caméras", slug: "CAMERA" },
  { label: "Optiques", slug: "LENS" },
  { label: "Éclairage", slug: "LIGHTING" },
  { label: "Son", slug: "SOUND" },
  { label: "Stabilisation", slug: "STABILIZER" },
  { label: "Drones", slug: "DRONE" },
  { label: "Accessoires", slug: "ACCESSORIES" },
];

const steps = [
  {
    icon: Users,
    title: "Rejoignez la communauté",
    desc: "Candidature validée par nos admins pour garantir un réseau de confiance.",
  },
  {
    icon: Camera,
    title: "Proposez ou louez",
    desc: "Publiez votre matériel ou réservez celui d'un autre créatif près de chez vous.",
  },
  {
    icon: Shield,
    title: "Louez en confiance",
    desc: "Profils vérifiés, avis mutuels et paiement sécurisé via Stripe.",
  },
];

export default async function HomePage() {
  const { user, tier } = await getAccessContext();
  const isMember = canViewListingDetails(tier);
  const isLoggedIn = !!user;

  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: isMember ? 6 : 3,
  });

  const listingVariant = isMember ? "full" : isLoggedIn ? "preview" : "teaser";

  return (
    <>
      <section className="relative overflow-hidden bg-anthracite text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            {isMember ? (
              <>
                <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
                  Bienvenue dans la communauté
                </p>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Bonjour{user?.name ? `, ${user.name.split(" ")[0]}` : ""}{" "}
                  <span className="text-accent">prêt à créer ?</span>
                </h1>
                <p className="mt-6 text-lg text-anthracite-300">
                  Parcourez le matériel disponible, réservez en quelques clics ou
                  proposez le vôtre à la communauté.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link href="/listings">
                    <Button size="lg">
                      Voir toutes les annonces
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/listings/new">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      <Plus className="mr-2 h-4 w-4" />
                      Proposer du matériel
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
                  Location P2P audiovisuelle
                </p>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Louez entre créatifs,{" "}
                  <span className="text-accent">en confiance.</span>
                </h1>
                <p className="mt-6 text-lg text-anthracite-300">
                  LoueTonMatos connecte cinéastes, photographes et techniciens pour
                  partager du matériel professionnel — sans friction, entre pairs de
                  confiance.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  {isLoggedIn ? (
                    <Link href="/dashboard">
                      <Button size="lg">
                        Mon tableau de bord
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/register">
                      <Button size="lg">
                        Rejoindre la communauté
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/listings">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      Voir les annonces
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-anthracite-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-anthracite-400">
            Catégories populaires
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={isMember ? `/listings?category=${cat.slug}` : "/listings"}
                className="rounded-full border border-anthracite-200 px-5 py-2 text-sm font-medium text-anthracite transition-colors hover:border-accent hover:text-accent"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-anthracite-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-anthracite">
                {isMember ? "Dernières annonces" : "Aperçu des annonces"}
              </h2>
              <p className="mt-2 text-sm text-anthracite-500">
                {isMember
                  ? "Réservez du matériel près de chez vous — mis à jour en temps réel."
                  : isLoggedIn
                    ? "Votre candidature est en cours — les prix seront visibles après validation."
                    : "Inscrivez-vous pour voir les détails et réserver du matériel."}
              </p>
            </div>
            {isMember && (
              <Link href="/listings">
                <Button variant="outline">
                  Tout voir
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {listings.length === 0 ? (
            <p className="mt-12 text-center text-anthracite-500">
              Aucune annonce pour le moment.
              {isMember && (
                <>
                  {" "}
                  <Link href="/listings/new" className="text-accent hover:underline">
                    Soyez le premier à publier !
                  </Link>
                </>
              )}
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  variant={listingVariant}
                />
              ))}
            </div>
          )}

          {!isMember && (
            <div className="mt-10 text-center">
              <Link href={isLoggedIn ? "/apply" : "/register"}>
                <Button>
                  {isLoggedIn ? "Compléter ma candidature" : "Rejoindre pour débloquer"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {!isMember && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-anthracite">
              Comment ça marche
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-anthracite-100 p-8 text-center"
                >
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted text-accent">
                    <step.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-anthracite">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-anthracite-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="flex justify-center gap-1 text-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <blockquote className="mt-4 text-xl font-medium text-anthracite">
            &ldquo;Enfin une plateforme pensée par et pour les créatifs. Zéro
            caution abusive, juste une vraie communauté.&rdquo;
          </blockquote>
          <p className="mt-3 text-sm text-anthracite-500">
            — Marie L., Directrice photo, Lyon
          </p>
        </div>
      </section>
    </>
  );
}
