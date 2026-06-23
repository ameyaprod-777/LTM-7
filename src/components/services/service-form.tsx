"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ServiceCategory, ServiceRateType } from "@prisma/client";
import { serviceSchema, type ServiceInput } from "@/lib/validations/service";
import {
  SERVICE_CATEGORY_LABELS,
  SERVICE_RATE_LABELS,
} from "@/lib/constants";
import { centsToEuros } from "@/lib/money";
import { useToast } from "@/components/providers/toast-provider";
import { ServicePhotoUpload } from "@/components/services/service-photo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  serviceId?: string;
  defaultValues?: Partial<ServiceInput> & { photoUrls?: string[] };
};

export function ServiceForm({ serviceId, defaultValues }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>(defaultValues?.photoUrls ?? []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ServiceInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? ServiceCategory.OTHER,
      rateType: defaultValues?.rateType ?? ServiceRateType.DAILY,
      priceAmount: defaultValues?.priceAmount
        ? centsToEuros(defaultValues.priceAmount as number)
        : undefined,
      city: defaultValues?.city ?? "",
      neighborhood: defaultValues?.neighborhood ?? "",
      experienceYears: defaultValues?.experienceYears ?? undefined,
      portfolioUrl: defaultValues?.portfolioUrl ?? "",
      photoUrls: defaultValues?.photoUrls ?? [],
    },
  });

  useEffect(() => {
    setValue("photoUrls", photos);
  }, [photos, setValue]);

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

  const onSubmit = async (data: ServiceInput) => {
    setLoading(true);
    const res = await fetch(
      serviceId ? `/api/services/${serviceId}` : "/api/services",
      {
        method: serviceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, photoUrls: photos }),
      }
    );
    setLoading(false);
    if (res.ok) {
      const json = await res.json();
      success(serviceId ? "Service mis à jour" : "Service publié");
      router.push(`/services/${json.id ?? serviceId}`);
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
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <div>
        <Label>Titre de la prestation *</Label>
        <Input
          placeholder="Ex. Pilote drone FPV — tournage pub & clip"
          error={errors.title?.message}
          {...register("title")}
        />
      </div>
      <div>
        <Label>Description *</Label>
        <Textarea
          rows={6}
          placeholder="Votre expérience, matériel, types de projets, zone d'intervention…"
          error={errors.description?.message}
          {...register("description")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Catégorie *</Label>
          <select
            className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm"
            {...register("category")}
          >
            {Object.entries(SERVICE_CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Type de tarif *</Label>
          <select
            className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm"
            {...register("rateType")}
          >
            {Object.entries(SERVICE_RATE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Tarif (€) *</Label>
          <Input
            type="number"
            step="0.01"
            error={errors.priceAmount?.message}
            {...register("priceAmount", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label>Ville *</Label>
          <Input error={errors.city?.message} {...register("city")} />
        </div>
        <div>
          <Label>Années d&apos;expérience</Label>
          <Input
            type="number"
            min={0}
            {...register("experienceYears", { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Quartier</Label>
          <Input {...register("neighborhood")} />
        </div>
        <div>
          <Label>Portfolio / showreel (URL)</Label>
          <Input placeholder="https://…" {...register("portfolioUrl")} />
        </div>
      </div>
      <div>
        <Label>Photos</Label>
        <div className="mt-2">
          <ServicePhotoUpload
            serviceId={serviceId}
            photos={photos}
            onChange={setPhotos}
          />
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          Certains champs sont invalides. Vérifiez le titre, la description (min.
          30 caractères), le tarif et la ville.
        </p>
      )}

      <Button type="submit" size="lg" loading={loading}>
        {serviceId ? "Enregistrer" : "Publier le service"}
      </Button>
    </form>
  );
}
