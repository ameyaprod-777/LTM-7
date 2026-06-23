"use client";

import Link from "next/link";
import { LEGAL_ROUTES } from "@/lib/legal-config";

type Props = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: React.ReactNode;
};

export function LegalConsentCheckbox({
  id,
  checked,
  onChange,
  error,
  children,
}: Props) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-anthracite-600">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-anthracite-300 text-accent focus:ring-accent"
        />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function RegisterLegalConsent({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <LegalConsentCheckbox
      id="acceptTerms"
      checked={checked}
      onChange={onChange}
      error={error}
    >
      J&apos;accepte les{" "}
      <Link href={LEGAL_ROUTES.cgu} className="text-accent hover:underline" target="_blank">
        CGU
      </Link>
      , les{" "}
      <Link href={LEGAL_ROUTES.cgv} className="text-accent hover:underline" target="_blank">
        CGV
      </Link>{" "}
      et la{" "}
      <Link
        href={LEGAL_ROUTES.privacy}
        className="text-accent hover:underline"
        target="_blank"
      >
        politique de confidentialité
      </Link>
      .
    </LegalConsentCheckbox>
  );
}

export function MembershipLegalConsent({
  acceptTerms,
  acceptKyc,
  onAcceptTermsChange,
  onAcceptKycChange,
  errors,
}: {
  acceptTerms: boolean;
  acceptKyc: boolean;
  onAcceptTermsChange: (v: boolean) => void;
  onAcceptKycChange: (v: boolean) => void;
  errors?: { terms?: string; kyc?: string };
}) {
  return (
    <div className="space-y-3 rounded-xl border border-anthracite-100 bg-anthracite-50/50 p-4">
      <p className="text-sm font-medium text-anthracite">Engagements légaux</p>
      <LegalConsentCheckbox
        id="acceptTerms"
        checked={acceptTerms}
        onChange={onAcceptTermsChange}
        error={errors?.terms}
      >
        J&apos;accepte les{" "}
        <Link href={LEGAL_ROUTES.cgu} className="text-accent hover:underline" target="_blank">
          CGU
        </Link>
        , les{" "}
        <Link href={LEGAL_ROUTES.cgv} className="text-accent hover:underline" target="_blank">
          CGV
        </Link>{" "}
        et la{" "}
        <Link
          href={LEGAL_ROUTES.privacy}
          className="text-accent hover:underline"
          target="_blank"
        >
          politique de confidentialité
        </Link>
        .
      </LegalConsentCheckbox>
      <LegalConsentCheckbox
        id="acceptKycPolicy"
        checked={acceptKyc}
        onChange={onAcceptKycChange}
        error={errors?.kyc}
      >
        J&apos;accepte la{" "}
        <Link href={LEGAL_ROUTES.kyc} className="text-accent hover:underline" target="_blank">
          politique KYC
        </Link>{" "}
        et atteste sur l&apos;honneur de l&apos;exactitude des pièces transmises.
      </LegalConsentCheckbox>
    </div>
  );
}

export function BookingMaterialConsent({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <LegalConsentCheckbox
      id="acceptMaterialTerms"
      checked={checked}
      onChange={onChange}
      error={error}
    >
      Je confirme avoir lu la{" "}
      <Link
        href={LEGAL_ROUTES.material}
        className="text-accent hover:underline"
        target="_blank"
      >
        charte responsabilité matériel
      </Link>{" "}
      : location sans caution sur la base de la confiance, et engagement à
      régler les frais en cas de casse, perte ou dommage imputable.
    </LegalConsentCheckbox>
  );
}
