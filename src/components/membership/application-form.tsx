"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  membershipApplicationFormSchema,
  CREATIVE_DOMAIN_LABELS,
  type MembershipApplicationFormInput,
} from "@/lib/validations/membership";
import { MembershipLegalConsent } from "@/components/legal/legal-consent-checkbox";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  invitationToken?: string;
  defaultValues?: Partial<MembershipApplicationFormInput>;
  currentImage?: string | null;
};

export function MembershipApplicationForm({
  invitationToken,
  defaultValues,
  currentImage = null,
}: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptKyc, setAcceptKyc] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    currentImage ?? defaultValues?.image ?? null
  );
  const [legalErrors, setLegalErrors] = useState<{
    terms?: string;
    kyc?: string;
  }>({});

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MembershipApplicationFormInput>({
    resolver: zodResolver(membershipApplicationFormSchema),
    defaultValues: {
      ...defaultValues,
      invitationToken,
      recentProjects: defaultValues?.recentProjects ?? [
        { title: "", url: "", description: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "recentProjects",
  });

  const onSubmit = async (values: MembershipApplicationFormInput) => {
    setLoading(true);
    setError(null);
    setLegalErrors({});

    if (!acceptTerms || !acceptKyc) {
      setLegalErrors({
        terms: !acceptTerms
          ? "Vous devez accepter les conditions pour continuer."
          : undefined,
        kyc: !acceptKyc
          ? "Vous devez accepter la politique KYC."
          : undefined,
      });
      setLoading(false);
      return;
    }

    const cleanProjects = (values.recentProjects ?? []).filter(
      (p) => p.title?.trim() || p.url?.trim() || p.description?.trim()
    );

    const res = await fetch("/api/membership/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        image: avatarUrl || values.image || "",
        recentProjects: cleanProjects,
        invitationToken,
        acceptTerms: true,
        acceptKycPolicy: true,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (typeof json.error === "string") {
        setError(json.error);
      } else {
        setError("Erreur lors de l'envoi de la candidature.");
      }
      return;
    }

    try {
      await update();
    } catch {
      // ignore
    }

    router.push("/dashboard?applied=1");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {invitationToken && (
        <div className="rounded-lg border border-accent/30 bg-accent-muted px-4 py-3 text-sm text-anthracite">
          Vous avez été invité·e par un membre — votre candidature sera traitée en
          priorité.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Certains champs sont invalides ou manquants. Corrigez les erreurs
          affichées puis réessayez.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nom complet *</Label>
          <Input id="name" error={errors.name?.message} {...register("name")} />
        </div>
        <div>
          <Label htmlFor="city">Ville *</Label>
          <Input id="city" error={errors.city?.message} {...register("city")} />
        </div>
      </div>

      <AvatarUpload
        currentImage={avatarUrl}
        inputId="apply-avatar-upload"
        onUploaded={(url) => {
          setAvatarUrl(url);
          void update({ user: { image: url } });
        }}
      />

      <div>
        <Label htmlFor="creativeDomain">Domaine créatif principal *</Label>
        <select
          id="creativeDomain"
          className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          {...register("creativeDomain")}
        >
          <option value="">Sélectionner…</option>
          {Object.entries(CREATIVE_DOMAIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.creativeDomain && (
          <p className="mt-1 text-xs text-red-600">
            {errors.creativeDomain.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="bio">Bio courte *</Label>
        <Textarea
          id="bio"
          rows={3}
          placeholder="Présentez-vous en quelques lignes…"
          error={errors.bio?.message}
          {...register("bio")}
        />
      </div>

      <div>
        <Label htmlFor="motivation">
          Pourquoi souhaitez-vous rejoindre la communauté ?
          {invitationToken ? (
            <span className="font-normal text-anthracite-400"> (facultatif)</span>
          ) : (
            " *"
          )}
        </Label>
        <Textarea
          id="motivation"
          rows={5}
          placeholder={
            invitationToken
              ? "Optionnel — vous avez été invité·e, quelques mots suffisent…"
              : "Votre expérience, vos projets, ce que vous recherchez…"
          }
          error={errors.motivation?.message}
          {...register("motivation")}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="portfolioUrl">Portfolio ou site web</Label>
          <Input
            id="portfolioUrl"
            placeholder="https://…"
            error={errors.portfolioUrl?.message}
            {...register("portfolioUrl")}
          />
          <p className="mt-1 text-xs text-anthracite-400">
            Un site vitrine, Behance, Vimeo, etc. — un seul lien suffit.
          </p>
        </div>
        <div>
          <Label htmlFor="instagramUrl">Instagram</Label>
          <Input
            id="instagramUrl"
            placeholder="@pseudo ou URL"
            {...register("instagramUrl")}
          />
        </div>
      </div>

      <div className="rounded-xl border border-anthracite-100 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-anthracite">Projets récents</p>
            <p className="text-xs text-anthracite-500">
              Ajoutez jusqu&apos;à 3 projets pour montrer votre travail (facultatif
              mais recommandé).
            </p>
          </div>
          {fields.length < 3 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ title: "", url: "", description: "" })}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-anthracite-100 bg-anthracite-50/40 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-anthracite-500">
                  Projet {index + 1}
                </p>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded p-1 text-anthracite-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Retirer ce projet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`project-title-${index}`}>Titre</Label>
                  <Input
                    id={`project-title-${index}`}
                    placeholder="Titre du projet"
                    {...register(`recentProjects.${index}.title` as const)}
                  />
                </div>
                <div>
                  <Label htmlFor={`project-url-${index}`}>Lien</Label>
                  <Input
                    id={`project-url-${index}`}
                    placeholder="https://…"
                    error={errors.recentProjects?.[index]?.url?.message}
                    {...register(`recentProjects.${index}.url` as const)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor={`project-desc-${index}`}>Description brève</Label>
                <Textarea
                  id={`project-desc-${index}`}
                  rows={2}
                  placeholder="En 1-2 lignes : rôle, contexte, diffusion…"
                  {...register(`recentProjects.${index}.description` as const)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <MembershipLegalConsent
        acceptTerms={acceptTerms}
        acceptKyc={acceptKyc}
        onAcceptTermsChange={setAcceptTerms}
        onAcceptKycChange={setAcceptKyc}
        errors={legalErrors}
      />

      <Button type="submit" size="lg" loading={loading}>
        Soumettre ma candidature
      </Button>
    </form>
  );
}
