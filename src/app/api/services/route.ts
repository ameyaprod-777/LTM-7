import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi } from "@/lib/api-auth";
import { serviceSchema } from "@/lib/validations/service";
import { eurosToCents } from "@/lib/money";
import { assertStripeConnectReadyForPublish } from "@/lib/stripe-connect-gate";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const city = searchParams.get("city");
  const mine = searchParams.get("mine") === "1";

  if (mine) {
    const auth = await requireMemberApi();
    if ("error" in auth) return auth.error;

    const services = await prisma.service.findMany({
      where: { ownerId: auth.session.user.id, status: { not: "REMOVED" } },
      include: { photos: { orderBy: { order: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(services);
  }

  const services = await prisma.service.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category: category as never } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      owner: { select: { id: true, name: true, city: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const connect = await assertStripeConnectReadyForPublish(auth.session.user.id);
  if (!connect.ok) return connect.response;

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const service = await prisma.service.create({
    data: {
      ownerId: auth.session.user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      rateType: data.rateType,
      priceAmount: eurosToCents(data.priceAmount as number),
      city: data.city,
      neighborhood: data.neighborhood,
      experienceYears: data.experienceYears ?? null,
      portfolioUrl: data.portfolioUrl || null,
      status: "ACTIVE",
    },
  });

  if (data.photoUrls.length > 0) {
    const { finalizeServicePhotoUrls } = await import("@/lib/service-storage");
    const finalized = await finalizeServicePhotoUrls(
      service.id,
      auth.session.user.id,
      data.photoUrls
    );
    await prisma.servicePhoto.createMany({
      data: finalized.map((url, i) => ({
        serviceId: service.id,
        url,
        order: i,
      })),
    });
  }

  return NextResponse.json({ id: service.id });
}
