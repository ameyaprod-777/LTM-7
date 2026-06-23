import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession, requireMemberApi, forbidden } from "@/lib/api-auth";
import { getAccessTier } from "@/lib/permissions";
import { getListingAvailability, parseDateKey } from "@/lib/listing-availability";

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

async function assertOwner(listingId: string, userId: string, role: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: NextResponse.json({ error: "Annonce introuvable" }, { status: 404 }) };
  if (listing.ownerId !== userId && role !== "ADMIN") {
    return { error: forbidden() };
  }
  return { listing };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const tier = getAccessTier(
    true,
    session.user.role,
    session.user.status
  );
  if (tier === "visitor") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id, status: { not: "REMOVED" } },
  });
  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  const availability = await getListingAvailability(params.id);
  return NextResponse.json(availability);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const check = await assertOwner(
    params.id,
    auth.session.user.id,
    auth.session.user.role
  );
  if (check.error) return check.error;

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const date = parseDateKey(parsed.data.date);

  const blocked = await prisma.blockedDate.upsert({
    where: {
      listingId_date: { listingId: params.id, date },
    },
    create: { listingId: params.id, date },
    update: {},
  });

  return NextResponse.json(blocked, { status: 201 });
}
