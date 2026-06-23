"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

type AccountsData = {
  accounts: { provider: string }[];
  hasPassword: boolean;
};

export function ConnectedAccounts() {
  const [data, setData] = useState<AccountsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    fetch("/api/users/me/accounts")
      .then((r) => r.json())
      .then(setData);
  };

  useEffect(() => {
    load();
  }, []);

  const hasGoogle = data?.accounts.some((a) => a.provider === "google");

  const unlinkGoogle = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/users/me/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google" }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(typeof json.error === "string" ? json.error : "Erreur");
      return;
    }
    setMessage("Compte Google déconnecté.");
    load();
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-anthracite-100 p-4">
        <div>
          <p className="font-medium text-anthracite">Google</p>
          <p className="text-sm text-anthracite-500">
            {hasGoogle ? "Connecté" : "Non connecté"}
          </p>
        </div>
        {hasGoogle ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={loading}
            onClick={unlinkGoogle}
          >
            Déconnecter
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => signIn("google", { callbackUrl: "/dashboard/settings" })}
          >
            Connecter
          </Button>
        )}
      </div>
      {message && <p className="text-sm text-anthracite-600">{message}</p>}
      {!data?.hasPassword && hasGoogle && (
        <p className="text-xs text-amber-800">
          Pour pouvoir déconnecter Google, définissez d&apos;abord un mot de passe
          via « Mot de passe oublié ».
        </p>
      )}
    </div>
  );
}
