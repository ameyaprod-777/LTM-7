"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  deleteAccountSchema,
  type DeleteAccountInput,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const onSubmit = async (data: DeleteAccountInput) => {
    if (
      !confirm(
        "Cette action est irréversible. Vos annonces seront retirées et vos données personnelles supprimées."
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/users/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Erreur");
      return;
    }

    await signOut({ redirect: false });
    router.push("/?deleted=1");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <p className="text-sm text-anthracite-600">
        La suppression anonymise votre compte et retire vos annonces. Les
        réservations passées peuvent être conservées à des fins de preuve.
      </p>
      {hasPassword && (
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        </div>
      )}
      <div>
        <Label htmlFor="confirm">
          Tapez <strong>SUPPRIMER</strong> pour confirmer
        </Label>
        <Input
          id="confirm"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="secondary" loading={loading}>
        Supprimer définitivement mon compte
      </Button>
    </form>
  );
}
