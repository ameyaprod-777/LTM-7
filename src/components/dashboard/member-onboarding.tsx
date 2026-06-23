"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

type Props = {
  hasProfile: boolean;
  hasListing: boolean;
  dismissed: boolean;
};

export function MemberOnboarding({
  hasProfile,
  hasListing,
  dismissed,
}: Props) {
  if (dismissed) return null;

  const steps = [
    {
      id: "profile",
      done: hasProfile,
      label: "Compléter votre profil",
      href: "/dashboard/settings",
    },
    {
      id: "listing",
      done: hasListing,
      label: "Publier votre première annonce",
      href: "/listings/new",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;

  return (
    <section
      className="mt-8 rounded-2xl border border-accent/20 bg-accent-muted/50 p-6"
      aria-labelledby="onboarding-title"
    >
      <h2 id="onboarding-title" className="font-semibold text-anthracite">
        Premiers pas sur LoueTonMatos
      </h2>
      <p className="mt-1 text-sm text-anthracite-500">
        {completed}/{steps.length} étapes — bienvenue dans la communauté !
      </p>
      <ul className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {step.done ? (
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-green-600"
                  aria-hidden
                />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-anthracite-300" aria-hidden />
              )}
              <span
                className={
                  step.done ? "text-anthracite-400 line-through" : "text-anthracite-700"
                }
              >
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
