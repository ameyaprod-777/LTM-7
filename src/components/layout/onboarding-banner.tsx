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
    <div className="border-b border-accent/30 bg-accent-muted/50 px-4 py-3 text-sm text-anthracite">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-accent" />
          {label}
        </span>
        <Link
          href={status.href}
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          {status.ctaLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
