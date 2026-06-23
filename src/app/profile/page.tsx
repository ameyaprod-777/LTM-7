import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessTier } from "@/lib/permissions";

/** Redirige vers le profil public du membre connecté. */
export default async function ProfileIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const tier = getAccessTier(
    true,
    session.user.role,
    session.user.status
  );

  if (tier === "member" || tier === "admin") {
    redirect(`/profile/${session.user.id}`);
  }

  if (tier === "pending") {
    redirect("/apply?reason=membership-required");
  }

  redirect("/register");
}
