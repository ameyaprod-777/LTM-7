"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterLegalConsent } from "@/components/legal/legal-consent-checkbox";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function RegisterForm({
  inviteToken,
  googleEnabled = false,
}: {
  inviteToken?: string;
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Email Google déjà vérifié → étape identité (pas /apply direct)
  const googleCallbackUrl = inviteToken
    ? `/verify-identity?invite=${encodeURIComponent(inviteToken)}`
    : "/verify-identity";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const onAcceptTerms = (v: boolean) => {
    setAcceptTerms(v);
    setValue("acceptTerms", v, { shouldValidate: true });
    if (v) setError(null);
  };

  const onGoogleClick = () => {
    if (!acceptTerms) {
      setError(
        "Cochez d’abord l’acceptation des conditions pour créer un compte avec Google."
      );
      return;
    }
    setError(null);
  };

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, acceptTerms: true, invite: inviteToken }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof json.error === "string"
          ? json.error
          : "Impossible de créer le compte."
      );
      return;
    }

    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    const verifyUrl = inviteToken
      ? `/verify-email?sent=1&invite=${encodeURIComponent(inviteToken)}`
      : "/verify-email?sent=1";
    router.push(verifyUrl);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-anthracite">
          Rejoindre la communauté
        </h1>
        <p className="mt-1 text-sm text-anthracite-500">
          Créez votre compte pour soumettre votre candidature
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Consentement commun (email + Google) — avant les deux parcours */}
      <RegisterLegalConsent
        checked={acceptTerms}
        onChange={onAcceptTerms}
        error={errors.acceptTerms?.message as string | undefined}
      />

      {googleEnabled && (
        <div className="space-y-3">
          <GoogleSignInButton
            callbackUrl={googleCallbackUrl}
            blocked={!acceptTerms}
            onBeforeSignIn={onGoogleClick}
            label="Créer un compte avec Google"
          />
          {!acceptTerms && (
            <p className="text-center text-xs text-anthracite-400">
              Acceptez les conditions ci-dessus pour activer Google.
            </p>
          )}        </div>
      )}

      {googleEnabled && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-anthracite-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-anthracite-400">
              ou par email
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Créer mon compte
        </Button>
      </form>

      <p className="text-center text-sm text-anthracite-500">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
