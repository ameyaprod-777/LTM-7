import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMemberApi } from "@/lib/api-auth";
import { getOrCreateServiceConversation } from "@/lib/conversations";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const startSchema = z.object({
  serviceId: z.string().min(1),
  message: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    const conversation = await getOrCreateServiceConversation(
      auth.session.user.id,
      parsed.data.serviceId,
      parsed.data.message
    );

    const service = await prisma.service.findUnique({
      where: { id: parsed.data.serviceId },
      select: { ownerId: true, title: true },
    });

    if (service && service.ownerId !== auth.session.user.id) {
      const sender = await prisma.user.findUnique({
        where: { id: auth.session.user.id },
        select: { name: true },
      });

      await createNotification({
        userId: service.ownerId,
        type: "NEW_MESSAGE",
        title: "Nouvelle demande de contact",
        body: `${sender?.name ?? "Un membre"} vous contacte pour « ${service.title} »`,
        link: `/dashboard/messages/${conversation.id}`,
      });
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "SERVICE_NOT_FOUND") {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }
    if (code === "SELF_CONTACT") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous contacter vous-même" },
        { status: 400 }
      );
    }
    console.error("[conversations]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
