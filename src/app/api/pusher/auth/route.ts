import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!pusherServer) {
    return NextResponse.json({ error: "Temps réel non configuré" }, { status: 503 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channel = params.get("channel_name");

  if (!socketId || !channel) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const match = channel.match(/^private-conversation-(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Canal non autorisé" }, { status: 403 });
  }

  const conversationId = match[1]!;
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.user.id },
  });

  if (!participant) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const auth = pusherServer.authorizeChannel(socketId, channel);
  return NextResponse.json(auth);
}
