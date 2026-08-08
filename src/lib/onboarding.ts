import { prisma } from "@/lib/prisma";

/**
 * Étape courante d'onboarding d'un utilisateur PENDING.
 * `pending` correspond à une candidature soumise et en attente admin.
 */
export type OnboardingStep =
  | "email"
  | "identity"
  | "apply"
  | "incomplete"
  | "rejected"
  | "pending";

export type OnboardingStatus = {
  step: OnboardingStep;
  /** Phrase courte affichable en bandeau. */
  message: string;
  /** Route vers laquelle rediriger pour progresser. */
  href: string;
  ctaLabel: string;
};

const CONFIG: Record<OnboardingStep, Omit<OnboardingStatus, "step">> = {
  email: {
    message: "Vérifiez votre adresse email pour continuer.",
    href: "/verify-email?sent=1",
    ctaLabel: "Vérifier",
  },
  identity: {
    message: "Vérifiez votre identité via Stripe pour poursuivre.",
    href: "/verify-identity",
    ctaLabel: "Vérifier",
  },
  apply: {
    message: "Complétez votre candidature d'adhésion.",
    href: "/apply",
    ctaLabel: "Compléter",
  },
  incomplete: {
    message: "Informations complémentaires demandées pour votre candidature.",
    href: "/apply",
    ctaLabel: "Compléter",
  },
  rejected: {
    message: "Votre candidature a été refusée. Vous pouvez en soumettre une nouvelle.",
    href: "/apply",
    ctaLabel: "Renvoyer",
  },
  pending: {
    message: "Votre candidature est en cours d'examen.",
    href: "/dashboard",
    ctaLabel: "Suivre",
  },
};

export function buildOnboardingStatus(user: {
  emailVerified: Date | null;
  verifiedIdentity: boolean;
  application: { status: string } | null;
}): OnboardingStatus {
  let step: OnboardingStep;
  if (!user.emailVerified) step = "email";
  else if (!user.verifiedIdentity) step = "identity";
  else if (!user.application) step = "apply";
  else if (user.application.status === "INCOMPLETE") step = "incomplete";
  else if (user.application.status === "REJECTED") step = "rejected";
  else step = "pending";

  return { step, ...CONFIG[step] };
}

/**
 * Récupère l'étape d'onboarding pour un utilisateur en base.
 * Retourne `null` si l'utilisateur n'existe pas.
 */
export async function getOnboardingStatus(
  userId: string
): Promise<OnboardingStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      verifiedIdentity: true,
      application: { select: { status: true } },
    },
  });
  if (!user) return null;
  return buildOnboardingStatus(user);
}
