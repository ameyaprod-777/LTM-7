"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResendVerificationForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(
    () => searchParams.get("registered") === "1"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/resend-verification-public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-anthracite">
          Renvoyer l&apos;email de vérification
        </h1>
        {sent ? (
          <div className="space-y-2 text-sm text-anthracite-600">
            {searchParams.get("registered") === "1" ? (
              <p>
                Compte créé. Consultez votre boîte mail pour confirmer votre
                adresse avant de vous connecter.
              </p>
            ) : (
              <p>
                Si un compte non vérifié existe, vous recevrez un nouvel email.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Envoyer
            </Button>
          </form>
        )}
        <Link href="/login" className="text-sm text-accent hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

export default function ResendVerificationPage() {
  return (
    <Suspense fallback={<p className="p-12 text-center">Chargement…</p>}>
      <ResendVerificationForm />
    </Suspense>
  );
}
