import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Réinitialiser le mot de passe" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<p className="text-anthracite-500">Chargement…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
