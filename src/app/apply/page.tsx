import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AlertCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembershipApplicationForm } from "@/components/membership/application-form";

export const metadata = {
  title: "Candidature",
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: { invite?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/apply");
  }

  if (session.user.role === "MEMBER" || session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { application: true },
  });

  const application = user?.application;

  if (application?.status === "PENDING") {
    redirect("/dashboard");
  }

  const isResubmit = application?.status === "INCOMPLETE";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-anthracite">Votre candidature</h1>
      <p className="mt-2 text-anthracite-500">
        {isResubmit
          ? "Complétez les pièces demandées par notre équipe pour poursuivre votre demande."
          : "Complétez votre profil et transmettez une pièce d'identité pour rejoindre la communauté LoueTonMatos. Chaque demande est examinée manuellement par notre équipe."}
      </p>

      {isResubmit && application.adminMessage && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Pièces complémentaires requises</p>
            <p className="mt-1">{application.adminMessage}</p>
          </div>
        </div>
      )}

      {application?.status === "REJECTED" && (
        <p className="mt-4 text-sm text-anthracite-500">
          Votre précédente demande a été refusée. Vous pouvez soumettre une nouvelle
          candidature ci-dessous.
        </p>
      )}

      <div className="mt-8">
        <MembershipApplicationForm
          invitationToken={searchParams.invite}
          defaultValues={{
            name: user?.name ?? "",
            city: user?.city ?? "",
            bio: user?.bio ?? "",
            image: user?.image ?? "",
            portfolioUrl: user?.portfolioUrl ?? "",
            instagramUrl: user?.instagramUrl ?? "",
            websiteUrl: user?.websiteUrl ?? "",
            creativeDomain: user?.creativeDomain ?? undefined,
          }}
        />
      </div>

      {application?.status === "REJECTED" && (
        <p className="mt-6 text-center text-sm text-anthracite-400">
          <Link href="/dashboard" className="text-accent hover:underline">
            Retour au tableau de bord
          </Link>
        </p>
      )}
    </div>
  );
}
