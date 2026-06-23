"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const [done, setDone] = useState(false);

  const report = async () => {
    const reason = window.prompt("Motif du signalement (min. 10 caractères)");
    if (!reason || reason.length < 10) return;

    const res = await fetch(`/api/reviews/${reviewId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (res.ok) setDone(true);
  };

  if (done) {
    return <p className="text-xs text-green-700">Signalement envoyé — merci.</p>;
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={report}>
      <Flag className="mr-1.5 h-3.5 w-3.5" />
      Signaler
    </Button>
  );
}
