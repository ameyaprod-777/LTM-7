import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession, requireMemberApi, forbidden } from "@/lib/api-auth";
import { getAccessTier } from "@/lib/permissions";
import { getServiceAvailability, parseDateKey } from "@/lib/service-availability";

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

async function assertOwner(serviceId: string, userId: string, role: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    return { error: NextResponse.json({ error: "Service introuvable" }, { status: 404 }) };
  }
  if (service.ownerId !== userId && role !== "ADMIN") {
    return { error: forbidden() };
  }
  return { service };
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

  const service = await prisma.service.findUnique({
    where: { id: params.id, status: { not: "REMOVED" } },
  });
  if (!service) {
    return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
  }

  const availability = await getServiceAvailability(params.id);
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

  const blocked = await prisma.serviceBlockedDate.upsert({
    where: {
      serviceId_date: { serviceId: params.id, date },
    },
    create: { serviceId: params.id, date },
    update: {},
  });

  return NextResponse.json(blocked, { status: 201 });
}
