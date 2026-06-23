import Image from "next/image";
import { formatDateTime } from "@/lib/utils";
import { ExternalLink, Paperclip } from "lucide-react";

export type TicketMessageItem = {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMime?: string | null;
};

export function TicketMessageList({ messages }: { messages: TicketMessageItem[] }) {
  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`rounded-lg p-3 text-sm ${
            m.isStaff ? "bg-accent-muted border border-accent/20" : "bg-anthracite-50"
          }`}
        >
          <p className="mb-1 text-xs text-anthracite-400">
            {m.isStaff ? "Équipe support" : "Vous"} · {formatDateTime(m.createdAt)}
          </p>
          <p className="whitespace-pre-wrap text-anthracite-700">{m.body}</p>
          {m.attachmentUrl && (
            <div className="mt-2">
              {m.attachmentMime?.startsWith("image/") ? (
                <a
                  href={m.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block max-w-sm overflow-hidden rounded-lg border border-anthracite-200"
                >
                  <Image
                    src={m.attachmentUrl}
                    alt={m.attachmentName ?? "Pièce jointe"}
                    width={400}
                    height={240}
                    className="h-auto w-full object-cover"
                    unoptimized
                  />
                </a>
              ) : (
                <a
                  href={m.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  <Paperclip className="h-4 w-4" />
                  {m.attachmentName ?? "Pièce jointe"}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
