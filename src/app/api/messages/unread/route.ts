import { NextResponse } from "next/server";
import { requireMemberApi } from "@/lib/api-auth";
import {
  countUnreadMessages,
  markAllConversationsAsRead,
} from "@/lib/messaging";

export async function GET() {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  const count = await countUnreadMessages(auth.session.user.id);
  return NextResponse.json({ count });
}

export async function PATCH() {
  const auth = await requireMemberApi();
  if ("error" in auth) return auth.error;

  await markAllConversationsAsRead(auth.session.user.id);
  return NextResponse.json({ ok: true, count: 0 });
}
