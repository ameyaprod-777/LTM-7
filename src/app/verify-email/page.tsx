import { Suspense } from "react";
import { VerifyEmailClient } from "@/components/auth/verify-email-client";

export const metadata = { title: "Vérification email" };

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-anthracite">Vérification email</h1>
        <Suspense fallback={<p className="text-sm text-anthracite-500">Chargement…</p>}>
          <VerifyEmailClient />
        </Suspense>
      </div>
    </div>
  );
}
