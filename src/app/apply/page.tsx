import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AlertCircle, ShieldCheck } from "lucide-react";
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
    include: {
      application: true,
      projects: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { title: true, description: true },
      },
    },
  });

  if (!user?.verifiedIdentity) {
    redirect("/verify-identity");
  }

  const application = user.application;
  const isPending = application?.status === "PENDING";
  const isResubmit = application?.status === "INCOMPLETE";

  // Extrait le lien éventuellement concaténé dans la description
  // (voir /api/membership/apply : "…\n\nLien : https://…")
  const recentProjects = user.projects.map((p) => {
    const desc = p.description ?? "";
    const linkMatch = desc.match(/\n\nLien\s*:\s*(\S+)$/);
    return {
      title: p.title,
      description: linkMatch ? desc.replace(linkMatch[0], "").trim() : desc,
      url: linkMatch ? linkMatch[1] : "",
    };
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-anthracite">
          Votre candidature est soumise
        </h1>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
          <div>
            <p className="font-semibold text-green-900">
              Merci ! Votre demande est en cours d&apos;examen.
            </p>
            <p className="mt-1 text-sm text-green-800">
              Notre équipe la vérifie sous quelques jours ouvrés. Vous serez
              notifié·e par email dès qu&apos;une décision aura été prise.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Link href="/dashboard" className="text-sm text-accent hover:underline">
            Retour au tableau de bord →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-anthracite">Votre candidature</h1>
      <p className="mt-2 text-anthracite-500">
        {isResubmit
          ? "Complétez les informations demandées par notre équipe pour poursuivre votre demande."
          : "Complétez votre profil pour rejoindre la communauté LoueTonMatos. Votre demande sera examinée par notre équipe."}
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Identité vérifiée par Stripe</p>
          <p className="mt-0.5">
            Vous n&apos;avez plus qu&apos;à remplir votre profil et votre
            motivation.
          </p>
        </div>
      </div>

      {isResubmit && application?.adminMessage && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Informations complémentaires requises</p>
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
          currentImage={user.image}
          defaultValues={{
            name: user.name ?? "",
            city: user.city ?? "",
            bio: user.bio ?? "",
            image: user.image ?? "",
            portfolioUrl: user.portfolioUrl || user.websiteUrl || "",
            instagramUrl: user.instagramUrl ?? "",
            creativeDomain: user.creativeDomain ?? undefined,
            motivation: application?.motivation ?? "",
            recentProjects:
              recentProjects.length > 0
                ? recentProjects
                : [{ title: "", url: "", description: "" }],
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
