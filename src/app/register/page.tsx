import { RegisterForm } from "@/components/auth/register-form";
import { isGoogleAuthConfigured } from "@/lib/auth";

export const metadata = {
  title: "Inscription",
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { invite?: string };
}) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <RegisterForm
        inviteToken={searchParams.invite}
        googleEnabled={isGoogleAuthConfigured()}
      />
    </div>
  );
}
