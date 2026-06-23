"use client";

import Link from "next/link";
import { Shield, FileImage } from "lucide-react";
import { Label } from "@/components/ui/label";
import { LEGAL_ROUTES } from "@/lib/legal-config";
import {
  KYC_IDENTITY_LABELS,
  type KycIdentityType,
} from "@/lib/validations/kyc";

type Props = {
  identityType: KycIdentityType;
  onIdentityTypeChange: (type: KycIdentityType) => void;
  errors?: string[];
};

function FileField({
  id,
  label,
  required,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  name,
}: {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  name: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {required && " *"}
      </Label>
      <label
        htmlFor={id}
        className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-anthracite-200 bg-anthracite-50/50 px-4 py-6 transition-colors hover:border-accent hover:bg-accent-muted/30"
      >
        <FileImage className="h-8 w-8 text-anthracite-400" />
        <span className="mt-2 text-center text-sm text-anthracite-500">
          JPG, PNG, WebP ou PDF — max. 5 Mo
        </span>
        <input
          id={id}
          name={name}
          type="file"
          accept={accept}
          required={required}
          className="sr-only"
        />
      </label>
    </div>
  );
}

export function KycUploadSection({
  identityType,
  onIdentityTypeChange,
  errors,
}: Props) {
  return (
    <section className="rounded-2xl border border-anthracite-100 bg-anthracite-50/40 p-6">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
        <div>
          <h2 className="font-semibold text-anthracite">Vérification d&apos;identité (KYC)</h2>
          <p className="mt-1 text-sm text-anthracite-500">
            Transmettez une pièce d&apos;identité valide. Les documents sont stockés de
            manière sécurisée et consultés uniquement par nos administrateurs pour
            valider votre candidature.
          </p>
        </div>
      </div>

      {errors && errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Label htmlFor="kycIdentityType">Type de pièce d&apos;identité *</Label>
        <select
          id="kycIdentityType"
          name="kycIdentityType"
          value={identityType}
          onChange={(e) =>
            onIdentityTypeChange(e.target.value as KycIdentityType)
          }
          className="mt-2 w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          required
        >
          {Object.entries(KYC_IDENTITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {identityType === "id_card" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FileField
              id="idCardFront"
              name="idCardFront"
              label="Recto"
              required
            />
            <FileField
              id="idCardBack"
              name="idCardBack"
              label="Verso"
              required
            />
          </div>
        )}

        {identityType === "passport" && (
          <FileField
            id="passport"
            name="passport"
            label="Passeport (page photo)"
            required
          />
        )}

        {identityType === "drivers_license" && (
          <FileField
            id="driversLicense"
            name="driversLicense"
            label="Permis de conduire (recto)"
            required
          />
        )}

        <div className="border-t border-anthracite-100 pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-anthracite-400">
            Documents complémentaires (optionnel)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileField
              id="proofOfAddress"
              name="proofOfAddress"
              label="Justificatif de domicile"
            />
            <FileField
              id="otherDocument"
              name="otherDocument"
              label="Autre (KBIS, attestation…)"
            />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-anthracite-400">
        Conformément au RGPD et à notre{" "}
        <Link
          href={LEGAL_ROUTES.kyc}
          className="text-accent hover:underline"
          target="_blank"
        >
          politique KYC
        </Link>
        , vos pièces sont conservées le temps de l&apos;examen de votre dossier et
        de votre adhésion. Elles ne sont jamais rendues publiques.
      </p>
    </section>
  );
}
