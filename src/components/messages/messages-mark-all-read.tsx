"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessagesMarkAllRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!hasUnread) return null;

  const markAll = async () => {
    setLoading(true);
    await fetch("/api/messages/unread", { method: "PATCH" });
    setLoading(false);
    window.dispatchEvent(new CustomEvent("ltm-messages-read"));
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={loading}
      onClick={() => void markAll()}
    >
      <CheckCheck className="mr-2 h-4 w-4" />
      Tout marquer comme lu
    </Button>
  );
}
