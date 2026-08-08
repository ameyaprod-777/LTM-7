"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ApplicationStatus } from "@prisma/client";

type Props = {
  applicationId: string;
  status: ApplicationStatus;
  initialAdminNotes?: string | null;
  readOnly?: boolean;
};

export function MembershipActions({
  applicationId,
  status,
  initialAdminNotes = "",
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notesSaved, setNotesSaved] = useState(false);

  const canAct = !readOnly && (status === "PENDING" || status === "INCOMPLETE");

  const callApi = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/membership/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Erreur");
      return false;
    }
    router.refresh();
    return true;
  };

  const saveNotes = async () => {
    setLoading("notes");
    setError(null);
    const ok = await callApi({ action: "save_notes", adminNotes });
    setLoading(null);
    if (ok) setNotesSaved(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Notes internes (admin uniquement)</Label>
        <textarea
          value={adminNotes}
          onChange={(e) => {
            setAdminNotes(e.target.value);
            setNotesSaved(false);
          }}
          disabled={readOnly}
          placeholder="Notes visibles uniquement par l'équipe…"
          className="mt-1 w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
          rows={2}
        />
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            loading={loading === "notes"}
            onClick={saveNotes}
          >
            Enregistrer les notes
          </Button>
        )}
        {notesSaved && (
          <p className="mt-1 text-xs text-green-600">Notes enregistrées.</p>
        )}
      </div>

      {canAct && (
        <>
          <div>
            <Label>Message au candidat</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message visible par le candidat…"
              className="mt-1 w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              loading={loading === "approve"}
              onClick={() => {
                setLoading("approve");
                setError(null);
                void callApi({
                  action: "approve",
                  message: message || undefined,
                  adminNotes,
                }).finally(() => setLoading(null));
              }}
            >
              Approuver
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={loading === "incomplete"}
              onClick={() => {
                if (!message.trim()) {
                  setError("Indiquez les informations manquantes pour le candidat.");
                  return;
                }
                setLoading("incomplete");
                setError(null);
                void callApi({
                  action: "incomplete",
                  message,
                  adminNotes,
                }).finally(() => setLoading(null));
              }}
            >
              Demander des informations
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={loading === "reject"}
              onClick={() => {
                setLoading("reject");
                setError(null);
                void callApi({
                  action: "reject",
                  message: message || undefined,
                  adminNotes,
                }).finally(() => setLoading(null));
              }}
            >
              Refuser
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
