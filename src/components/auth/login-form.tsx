"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/apply";
  const errorParam = searchParams.get("error");
  const resetOk = searchParams.get("reset") === "1";
  const verifiedOk = searchParams.get("verified") === "1";
  const [error, setError] = useState<string | null>(() => {
    if (errorParam === "banned") return "Votre compte a été suspendu.";
    if (errorParam === "suspended")
      return "Votre compte est temporairement suspendu.";
    return null;
  });
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error === "EMAIL_NOT_VERIFIED") {
        setError(
          "Vérifiez votre email avant de vous connecter. Consultez votre boîte de réception ou renvoyez l'email depuis les paramètres après une première connexion Google."
        );
      } else {
        setError(
          result.error === "CredentialsSignin"
            ? "Email ou mot de passe incorrect."
            : result.error
        );
      }
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-anthracite">Connexion</h1>
        <p className="mt-1 text-sm text-anthracite-500">
          Accédez à votre espace LoueTonMatos
        </p>
      </div>

      {resetOk && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Mot de passe mis à jour. Vous pouvez vous connecter.
        </div>
      )}

      {verifiedOk && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Adresse email confirmée. Connectez-vous pour passer à l&apos;étape
          suivante (vérification d&apos;identité).
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {error.includes("Vérifiez votre email") && (
            <p className="mt-2">
              <Link href="/resend-verification" className="font-medium underline">
                Renvoyer l&apos;email de vérification
              </Link>
            </p>
          )}
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
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-accent hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Se connecter
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-anthracite-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-anthracite-400">ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continuer avec Google
      </Button>

      <p className="text-center text-sm text-anthracite-500">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Rejoindre la communauté
        </Link>
      </p>
    </div>
  );
}

