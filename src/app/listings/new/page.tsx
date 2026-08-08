import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessTier, canPostListings } from "@/lib/permissions";
import { userNeedsStripeConnectSetup } from "@/lib/stripe-connect-gate";
import { ListingForm } from "@/components/listings/listing-form";
import { StripeConnectRequired } from "@/components/payments/stripe-connect-required";

export const metadata = { title: "Nouvelle annonce" };

export default async function NewListingPage() {
  const session = await getServerSession(authOptions);
  const tier = getAccessTier(
    !!session,
    session?.user?.role,
    session?.user?.status
  );

  if (!canPostListings(tier) || !session?.user?.id) {
    redirect("/apply?reason=membership-required");
  }

  const needsConnect = await userNeedsStripeConnectSetup(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-anthracite">Proposer du matériel</h1>
      {needsConnect ? (
        <div className="mt-6">
          <StripeConnectRequired resourceLabel="une annonce" />
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-anthracite-500">
            Uploadez vos photos (JPG, PNG, WebP) ou collez une URL externe.
          </p>
          <div className="mt-8">
            <ListingForm />
          </div>
        </>
      )}
    </div>
  );
}
