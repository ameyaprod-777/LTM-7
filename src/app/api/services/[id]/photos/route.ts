import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";
import {
  saveServicePhotoFile,
  servicePhotoPublicUrl,
} from "@/lib/service-storage";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const service = await prisma.service.findUnique({
    where: { id: params.id },
    include: { photos: true },
  });

  if (!service) {
    return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
  }

  if (
    service.ownerId !== auth.session.user.id &&
    auth.session.user.role !== "ADMIN"
  ) {
    return forbidden();
  }

  if (service.photos.length >= 6) {
    return NextResponse.json(
      { error: "Maximum 6 photos par service." },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  try {
    const stored = await saveServicePhotoFile(params.id, file);
    const url = servicePhotoPublicUrl(params.id, stored.filename);

    const photo = await prisma.servicePhoto.create({
      data: {
        serviceId: params.id,
        url,
        order: service.photos.length,
      },
    });

    return NextResponse.json({ url, photo }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
