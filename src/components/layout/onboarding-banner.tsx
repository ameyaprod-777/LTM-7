import Link from "next/link";
import {
  ArrowRight,
  Mail,
  ShieldCheck,
  ClipboardEdit,
  AlertCircle,
  RotateCcw,
  Clock,
} from "lucide-react";
import type { OnboardingStatus } from "@/lib/onboarding";

const ICONS: Record<OnboardingStatus["step"], typeof Mail> = {
  email: Mail,
  identity: ShieldCheck,
  apply: ClipboardEdit,
  incomplete: AlertCircle,
  rejected: RotateCcw,
  pending: Clock,
};

const STEP_LABELS: Record<OnboardingStatus["step"], string> = {
  email: "Étape 1 sur 3 — Vérifiez votre adresse email.",
  identity: "Étape 2 sur 3 — Vérifiez votre identité via Stripe.",
  apply: "Étape 3 sur 3 — Complétez votre candidature.",
  incomplete: "Complétez votre candidature (informations manquantes).",
  rejected: "Candidature refusée — vous pouvez en soumettre une nouvelle.",
  pending: "Candidature en cours d'examen par notre équipe.",
};

export function OnboardingBanner({ status }: { status: OnboardingStatus }) {
  const Icon = ICONS[status.step];
  const label = STEP_LABELS[status.step];

  return (
    <div className="border-b border-accent/30 bg-accent-muted/50 px-3 py-3 text-sm text-anthracite sm:px-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="inline-flex min-w-0 items-start gap-2 sm:items-center">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent sm:mt-0" />
          <span className="leading-snug">{label}</span>
        </span>
        <Link
          href={status.href}
          className="inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-lg bg-accent px-3 py-2.5 text-xs font-semibold text-white hover:bg-accent-hover sm:w-auto sm:py-1.5"
        >
          {status.ctaLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
