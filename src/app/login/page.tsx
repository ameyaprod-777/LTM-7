import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<p className="text-anthracite-500">Chargement…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
