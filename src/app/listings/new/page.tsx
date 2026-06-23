import { ListingForm } from "@/components/listings/listing-form";

export const metadata = { title: "Nouvelle annonce" };

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-anthracite">Proposer du matériel</h1>
      <p className="mt-1 text-sm text-anthracite-500">
        Uploadez vos photos (JPG, PNG, WebP) ou collez une URL externe.
      </p>
      <div className="mt-8">
        <ListingForm />
      </div>
    </div>
  );
}
