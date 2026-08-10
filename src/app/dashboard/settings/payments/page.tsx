import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PaymentsSettings } from "@/components/settings/payments-settings";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Paiements" };

export default async function PaymentsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1 text-sm text-anthracite-500 hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" />
        Paramètres
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-anthracite">Paiements & virements</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        <strong className="font-medium text-anthracite">Stripe Connect</strong>{" "}
        est le moyen le plus sécurisé et le plus fiable — c&apos;est celui que
        LoueTonMatos recommande. L&apos;IBAN reste une alternative rapide pour
        démarrer.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-anthracite-400">Chargement…</p>}>
          <PaymentsSettings />
        </Suspense>
      </div>
    </div>
  );
}
