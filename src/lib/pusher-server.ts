import Pusher from "pusher";

export const pusherServer =
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER ?? "eu",
        useTLS: true,
      })
    : null;

export function pusherEnabled() {
  return !!pusherServer;
}

export function conversationChannel(conversationId: string) {
  return `private-conversation-${conversationId}`;
}

export async function publishNewMessage(
  conversationId: string,
  payload: Record<string, unknown>
) {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(
      conversationChannel(conversationId),
      "new-message",
      payload
    );
  } catch (err) {
    console.error("[pusher] publish failed", err);
  }
}

export async function publishMessageDeleted(
  conversationId: string,
  messageId: string
) {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(
      conversationChannel(conversationId),
      "message-deleted",
      { messageId }
    );
  } catch (err) {
    console.error("[pusher] delete publish failed", err);
  }
}
