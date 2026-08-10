import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, isGoogleAuthConfigured } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/settings-form";
import { ProjectForm } from "@/components/settings/project-form";
import { PasswordForm } from "@/components/settings/password-form";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { DataExportButton } from "@/components/settings/data-export-button";
import { EmailVerificationBanner } from "@/components/settings/email-verification-banner";
import { EmailTestButton } from "@/components/settings/email-test-button";
import { isEmailConfigured } from "@/lib/email";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { projects: { orderBy: { createdAt: "desc" } } },
  });
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-anthracite">Paramètres</h1>

      {!user.emailVerified && !user.email.endsWith("@louetonmatos.invalid") && (
        <div className="mt-6">
          <EmailVerificationBanner email={user.email} />
        </div>
      )}

      <div className="mt-6">
        <EmailTestButton
          configured={isEmailConfigured()}
          fromEmail={
            process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ??
            process.env.EMAIL_REPLY_TO ??
            "support@louetonmatos.fr"
          }
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-anthracite">Profil</h2>
          {(session.user.role === "MEMBER" || session.user.role === "ADMIN") && (
            <a
              href={`/profile/${session.user.id}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              Voir mon profil public →
            </a>
          )}
        </div>
        <SettingsForm user={user} />
      </section>

      <section className="mt-12 border-t border-anthracite-100 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-anthracite">Paiements</h2>
        <p className="mb-4 text-sm text-anthracite-500">
          Compte Stripe Connect pour recevoir les paiements de vos locations.
        </p>
        <a
          href="/dashboard/settings/payments"
          className="inline-flex rounded-lg border border-anthracite-200 px-4 py-2 text-sm font-medium text-anthracite-700 hover:border-accent hover:text-accent"
        >
          Gérer mes paiements →
        </a>
      </section>

      <section className="mt-12 border-t border-anthracite-100 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-anthracite">
          Mot de passe
        </h2>
        <PasswordForm hasPassword={!!user.passwordHash} />
      </section>

      <section className="mt-12 border-t border-anthracite-100 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-anthracite">
          Mes données (RGPD)
        </h2>
        <DataExportButton />
      </section>

      <section className="mt-12 border-t border-anthracite-100 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-anthracite">
          Comptes connectés
        </h2>
        <ConnectedAccounts googleEnabled={isGoogleAuthConfigured()} />
      </section>

      <section className="mt-12 border-t border-anthracite-100 pt-8">
        <h2 className="text-lg font-semibold text-anthracite">Mes projets</h2>
        <p className="text-sm text-anthracite-500">
          Portfolio affiché sur votre profil public.
        </p>
        <div className="mt-4">
          <ProjectForm />
        </div>
        <ul className="mt-6 space-y-2">
          {user.projects.map((p) => (
            <li key={p.id} className="text-sm text-anthracite-600">
              {p.title}
              {p.tags.length > 0 && ` · ${p.tags.join(", ")}`}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 border-t border-red-100 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-red-800">
          Zone de danger
        </h2>
        <DeleteAccountForm hasPassword={!!user.passwordHash} />
      </section>
    </div>
  );
}
