"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-anthracite">Email envoyé</h1>
        <p className="text-sm text-anthracite-600">
          Si un compte existe avec cet email, vous recevrez un lien pour
          réinitialiser votre mot de passe (valide 1 heure).
        </p>
        <Link href="/login" className="text-sm font-medium text-accent hover:underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-anthracite">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-anthracite-500">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
      </div>

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
        <Button type="submit" className="w-full" loading={loading}>
          Envoyer le lien
        </Button>
      </form>

      <p className="text-center text-sm text-anthracite-500">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
