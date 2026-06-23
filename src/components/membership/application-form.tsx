"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  membershipApplicationSchema,
  CREATIVE_DOMAIN_LABELS,
  type MembershipApplicationInput,
} from "@/lib/validations/membership";
import type { KycIdentityType } from "@/lib/validations/kyc";
import { KycUploadSection } from "@/components/membership/kyc-upload-section";
import { MembershipLegalConsent } from "@/components/legal/legal-consent-checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  invitationToken?: string;
  defaultValues?: Partial<MembershipApplicationInput>;
};

export function MembershipApplicationForm({
  invitationToken,
  defaultValues,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [kycErrors, setKycErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [kycIdentityType, setKycIdentityType] = useState<KycIdentityType>(
    defaultValues?.kycIdentityType ?? "id_card"
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptKyc, setAcceptKyc] = useState(false);
  const [legalErrors, setLegalErrors] = useState<{
    terms?: string;
    kyc?: string;
  }>({});

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MembershipApplicationInput>({
    resolver: zodResolver(membershipApplicationSchema),
    defaultValues: {
      kycIdentityType: "id_card",
      ...defaultValues,
      invitationToken,
    },
  });

  useEffect(() => {
    setValue("kycIdentityType", kycIdentityType);
  }, [kycIdentityType, setValue]);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    setKycErrors([]);
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

    const form = document.getElementById("membership-form") as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("kycIdentityType", kycIdentityType);
    formData.set("acceptTerms", "true");
    formData.set("acceptKycPolicy", "true");
    if (invitationToken) {
      formData.set("invitationToken", invitationToken);
    }

    const res = await fetch("/api/membership/apply", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (json.error?.kyc) {
        setKycErrors(
          Array.isArray(json.error.kyc) ? json.error.kyc : [json.error.kyc]
        );
      }
      if (typeof json.error === "string") {
        setError(json.error);
      } else if (!json.error?.kyc) {
        setError("Erreur lors de l'envoi de la candidature.");
      }
      return;
    }

    router.push("/dashboard?applied=1");
    router.refresh();
  };

  return (
    <form
      id="membership-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      encType="multipart/form-data"
    >
      {invitationToken && (
        <input type="hidden" name="invitationToken" value={invitationToken} />
      )}

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

      <div>
        <Label htmlFor="image">URL photo de profil</Label>
        <Input
          id="image"
          placeholder="https://..."
          error={errors.image?.message}
          {...register("image")}
        />
      </div>

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
          Pourquoi souhaitez-vous rejoindre la communauté ? *
        </Label>
        <Textarea
          id="motivation"
          rows={5}
          placeholder="Votre expérience, vos projets, ce que vous recherchez…"
          error={errors.motivation?.message}
          {...register("motivation")}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <Label htmlFor="portfolioUrl">Portfolio</Label>
          <Input id="portfolioUrl" {...register("portfolioUrl")} />
        </div>
        <div>
          <Label htmlFor="instagramUrl">Instagram</Label>
          <Input id="instagramUrl" {...register("instagramUrl")} />
        </div>
        <div>
          <Label htmlFor="websiteUrl">Site web</Label>
          <Input id="websiteUrl" {...register("websiteUrl")} />
        </div>
      </div>

      <KycUploadSection
        identityType={kycIdentityType}
        onIdentityTypeChange={setKycIdentityType}
        errors={kycErrors.length > 0 ? kycErrors : undefined}
      />

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
