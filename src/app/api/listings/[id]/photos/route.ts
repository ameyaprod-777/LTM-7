import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMemberApi, forbidden } from "@/lib/api-auth";
import {
  saveListingPhotoFile,
  listingPhotoPublicUrl,
} from "@/lib/listing-storage";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { photos: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  if (
    listing.ownerId !== auth.session.user.id &&
    auth.session.user.role !== "ADMIN"
  ) {
    return forbidden();
  }

  if (listing.photos.length >= 10) {
    return NextResponse.json(
      { error: "Maximum 10 photos par annonce." },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  try {
    const stored = await saveListingPhotoFile(params.id, file);
    const url = listingPhotoPublicUrl(params.id, stored.filename);

    const photo = await prisma.listingPhoto.create({
      data: {
        listingId: params.id,
        url,
        order: listing.photos.length,
      },
    });

    return NextResponse.json({ url, photo }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload impossible";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
