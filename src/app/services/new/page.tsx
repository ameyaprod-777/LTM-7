import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessTier, canPostListings } from "@/lib/permissions";
import { userNeedsStripeConnectSetup } from "@/lib/stripe-connect-gate";
import { ServiceForm } from "@/components/services/service-form";
import { StripeConnectRequired } from "@/components/payments/stripe-connect-required";

export const metadata = { title: "Proposer un service" };

export default async function NewServicePage() {
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
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-anthracite">Proposer un service</h1>
      {needsConnect ? (
        <div className="mt-6">
          <StripeConnectRequired resourceLabel="un service" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-anthracite-500">
            Pilote drone, chef op, montage, son… Présentez votre prestation à la
            communauté.
          </p>
          <div className="mt-8">
            <ServiceForm />
          </div>
        </>
      )}
    </div>
  );
}
