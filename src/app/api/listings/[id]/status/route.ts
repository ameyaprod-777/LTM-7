import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";
import { validateListingReadyForPublish } from "@/lib/listing-draft";

const schema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "DRAFT"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }
  if (
    listing.ownerId !== auth.session.user.id &&
    auth.session.user.role !== "ADMIN"
  ) {
    return forbidden();
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  if (parsed.data.status === "ACTIVE" && listing.status === "DRAFT") {
    const check = validateListingReadyForPublish(listing);
    if (!check.success) {
      return NextResponse.json(
        {
          error:
            "Complétez l'annonce (description, prix, ville…) avant publication.",
          fields: check.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
