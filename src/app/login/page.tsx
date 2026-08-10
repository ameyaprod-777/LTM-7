import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { isGoogleAuthConfigured } from "@/lib/auth";

export const metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  const googleEnabled = isGoogleAuthConfigured();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<p className="text-anthracite-500">Chargement…</p>}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </div>
  );
}
