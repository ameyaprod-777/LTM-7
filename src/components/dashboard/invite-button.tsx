"use client";

import { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InviteButton() {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const res = await fetch("/api/invitations", { method: "POST" });
    const json = await res.json();
    setLoading(false);
    if (res.ok) setLink(json.link);
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        loading={loading}
        onClick={generate}
      >
        <Mail className="mr-2 h-4 w-4" />
        Générer un lien d&apos;invitation
      </Button>
      {link && (
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-anthracite-50 px-2 py-1 text-xs">
            {link}
          </code>
          <button
            type="button"
            onClick={copy}
            className="text-anthracite-500 hover:text-accent"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
