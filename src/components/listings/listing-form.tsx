"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ListingCategory,
  ConditionRating,
  DeliveryOption,
  DeliveryPricingType,
  DeliverySlot,
  CancellationPolicy,
} from "@prisma/client";
import { listingSchema, type ListingInput } from "@/lib/validations/listing";
import { useToast } from "@/components/providers/toast-provider";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  DELIVERY_OPTION_LABELS,
  DELIVERY_PRICING_LABELS,
  DELIVERY_SLOT_LABELS,
  CANCELLATION_LABELS,
} from "@/lib/constants";
import { deliveryOptionNeedsConfig } from "@/lib/listing-payload";
import { centsToEuros } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListingPhotoUpload } from "@/components/listings/listing-photo-upload";
import { AvailabilityCalendar } from "@/components/listings/availability-calendar";

type Props = {
  listingId?: string;
  defaultValues?: Partial<ListingInput> & {
    photoUrls?: string[];
    tagNames?: string[];
  };
};

export function ListingForm({ listingId, defaultValues }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [photoInput, setPhotoInput] = useState("");
  const [photos, setPhotos] = useState<string[]>(defaultValues?.photoUrls ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(defaultValues?.tagNames ?? []);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ListingInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(listingSchema) as any,
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? ListingCategory.CAMERA,
      pricePerDay: defaultValues?.pricePerDay
        ? centsToEuros(defaultValues.pricePerDay as number)
        : undefined,
      pricePerWeek: defaultValues?.pricePerWeek
        ? centsToEuros(defaultValues.pricePerWeek as number)
        : undefined,
      weekendPricePerDay: defaultValues?.weekendPricePerDay
        ? centsToEuros(defaultValues.weekendPricePerDay as number)
        : undefined,
      condition: defaultValues?.condition ?? ConditionRating.GOOD,
      city: defaultValues?.city ?? "",
      neighborhood: defaultValues?.neighborhood ?? "",
      deliveryOption: defaultValues?.deliveryOption ?? DeliveryOption.PICKUP_ONLY,
      deliveryRadiusKm: defaultValues?.deliveryRadiusKm ?? undefined,
      deliveryPricingType:
        defaultValues?.deliveryPricingType ?? DeliveryPricingType.FLAT,
      deliveryFlatFee: defaultValues?.deliveryFlatFee
        ? centsToEuros(defaultValues.deliveryFlatFee as number)
        : undefined,
      deliveryFeePerKm: defaultValues?.deliveryFeePerKm ?? undefined,
      deliverySlots: defaultValues?.deliverySlots ?? [],
      cancellationPolicy:
        defaultValues?.cancellationPolicy ?? CancellationPolicy.MODERATE,
      photoUrls: defaultValues?.photoUrls ?? [],
      tagNames: defaultValues?.tagNames ?? [],
    },
  });

  useEffect(() => {
    setValue("photoUrls", photos);
  }, [photos, setValue]);

  useEffect(() => {
    setValue("tagNames", tags);
  }, [tags, setValue]);

  const deliveryOption = watch("deliveryOption");
  const deliveryPricingType = watch("deliveryPricingType");
  const needsDelivery = deliveryOptionNeedsConfig(deliveryOption);

  const addPhotoUrl = () => {
    if (photoInput && photos.length < 10) {
      setPhotos([...photos, photoInput]);
      setPhotoInput("");
    }
  };

  const addTag = () => {
    const name = tagInput.trim().toLowerCase();
    if (name && !tags.includes(name) && tags.length < 8) {
      setTags([...tags, name]);
      setTagInput("");
    }
  };

  const deliverySlots = watch("deliverySlots") ?? [];

  const toggleSlot = (slot: DeliverySlot) => {
    const next = deliverySlots.includes(slot)
      ? deliverySlots.filter((s) => s !== slot)
      : [...deliverySlots, slot];
    setValue("deliverySlots", next);
  };

  const formatApiError = (error: unknown): string => {
    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
      const parts = Object.entries(error as Record<string, string[] | string>)
        .flatMap(([key, val]) => {
          if (Array.isArray(val)) return val.map((m) => `${key}: ${m}`);
          if (typeof val === "string") return [`${key}: ${val}`];
          return [];
        });
      if (parts.length > 0) return parts.join(" · ");
    }
    return "Enregistrement impossible";
  };

  const saveListing = async (data: ListingInput, publish: boolean) => {
    setLoading(true);
    const res = await fetch(
      listingId ? `/api/listings/${listingId}` : "/api/listings",
      {
        method: listingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          photoUrls: photos,
          tagNames: tags,
          ...(!listingId ? { publish } : {}),
        }),
      }
    );
    setLoading(false);
    if (res.ok) {
      const json = await res.json();
      if (!listingId && !publish) {
        success("Brouillon enregistré");
        router.push(`/listings/${json.id}/edit`);
      } else {
        success(listingId ? "Annonce mise à jour" : "Annonce publiée");
        router.push(`/listings/${json.id ?? listingId}/edit`);
      }
      router.refresh();
      return;
    }
    const errBody = await res.json().catch(() => ({}));
    toastError(formatApiError(errBody.error));
  };

  const onSubmit = (data: ListingInput) => void saveListing(data, true);

  const onSaveDraft = async () => {
    const values = watch();
    if (!values.title || values.title.trim().length < 3) {
      toastError("Indiquez un titre d'au moins 3 caractères.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        photoUrls: photos,
        tagNames: tags,
        publish: false,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const json = await res.json();
      success("Brouillon enregistré");
      router.push(`/listings/${json.id}/edit`);
      router.refresh();
      return;
    }
    const errBody = await res.json().catch(() => ({}));
    toastError(formatApiError(errBody.error));
  };

  const onInvalid = (fieldErrors: typeof errors) => {
    const first = Object.values(fieldErrors)[0];
    const msg =
      first && typeof first === "object" && "message" in first
        ? String(first.message)
        : "Vérifiez les champs obligatoires du formulaire.";
    toastError(msg);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
      <section className="space-y-4">
        <div>
          <Label>Titre *</Label>
          <Input error={errors.title?.message} {...register("title")} />
        </div>
        <div>
          <Label>Description *</Label>
          <Textarea rows={5} error={errors.description?.message} {...register("description")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Catégorie *</Label>
            <select className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm" {...register("category")}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>État *</Label>
            <select className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm" {...register("condition")}>
              {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-anthracite">Tarifs</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Prix / jour (€) *</Label>
            <Input type="number" step="0.01" error={errors.pricePerDay?.message} {...register("pricePerDay", { valueAsNumber: true })} />
          </div>
          <div>
            <Label>Prix / semaine (€)</Label>
            <Input type="number" step="0.01" {...register("pricePerWeek", { valueAsNumber: true })} />
            <p className="mt-1 text-xs text-anthracite-400">Appliqué pour 7 jours ou plus</p>
          </div>
          <div>
            <Label>Prix week-end / jour (€)</Label>
            <Input type="number" step="0.01" {...register("weekendPricePerDay", { valueAsNumber: true })} />
            <p className="mt-1 text-xs text-anthracite-400">Samedi & dimanche</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-anthracite">Localisation</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Ville *</Label>
            <Input error={errors.city?.message} {...register("city")} />
          </div>
          <div>
            <Label>Quartier</Label>
            <Input {...register("neighborhood")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-anthracite">Livraison</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Mode</Label>
            <select className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm" {...register("deliveryOption")}>
              {Object.entries(DELIVERY_OPTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Annulation</Label>
            <select className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm" {...register("cancellationPolicy")}>
              {Object.entries(CANCELLATION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {needsDelivery && (
          <>
            <div>
              <Label>Tarification livraison</Label>
              <select className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm" {...register("deliveryPricingType")}>
                {Object.entries(DELIVERY_PRICING_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {deliveryPricingType === "FLAT" && (
              <div>
                <Label>Forfait livraison (€)</Label>
                <Input type="number" step="0.01" {...register("deliveryFlatFee", { valueAsNumber: true })} />
              </div>
            )}
            {deliveryPricingType === "PER_KM" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tarif au km (€)</Label>
                  <Input type="number" step="0.01" {...register("deliveryFeePerKm", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label>Rayon max. (km)</Label>
                  <Input type="number" step="0.1" {...register("deliveryRadiusKm", { valueAsNumber: true })} />
                </div>
              </div>
            )}
            <div>
              <Label>Créneaux proposés</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(DELIVERY_SLOT_LABELS) as DeliverySlot[]).map((slot) => {
                  const selected = deliverySlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        selected
                          ? "border-accent bg-accent-muted text-accent"
                          : "border-anthracite-200"
                      }`}
                    >
                      {DELIVERY_SLOT_LABELS[slot]}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-anthracite">Photos</h2>
        <ListingPhotoUpload
          listingId={listingId}
          photos={photos}
          onChange={setPhotos}
        />
        <div className="flex gap-2">
          <Input
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
            placeholder="https://… ou uploader ci-dessus"
          />
          <Button type="button" variant="outline" onClick={addPhotoUrl}>
            URL
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-anthracite">Tags</h2>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="ex. sony, 4k"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-anthracite-100 px-2 py-0.5 text-xs"
            >
              {t}
              <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>×</button>
            </span>
          ))}
        </div>
      </section>

      {listingId && (
        <AvailabilityCalendar listingId={listingId} editable />
      )}

      {Object.keys(errors).length > 0 && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          Certains champs sont invalides. Vérifiez le titre, la description, le prix
          / jour et la ville.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={loading}>
          {listingId ? "Enregistrer" : "Publier l'annonce"}
        </Button>
        {!listingId && (
          <Button
            type="button"
            variant="outline"
            loading={loading}
            onClick={() => void onSaveDraft()}
          >
            Enregistrer en brouillon
          </Button>
        )}
      </div>
    </form>
  );
}
