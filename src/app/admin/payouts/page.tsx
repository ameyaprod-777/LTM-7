import { AdminPayoutsPanel } from "@/components/admin/admin-payouts-panel";

export const metadata = { title: "Virements IBAN" };

export default function AdminPayoutsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Virements IBAN</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Locations clôturées en attente d&apos;un virement SEPA vers le loueur.
        Effectuez le virement depuis votre banque, puis marquez « versé ».
      </p>
      <div className="mt-8">
        <AdminPayoutsPanel />
      </div>
    </div>
  );
}
