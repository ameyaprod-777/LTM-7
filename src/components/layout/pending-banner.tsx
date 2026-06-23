import { Clock } from "lucide-react";

export function PendingBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
      <span className="inline-flex items-center gap-2">
        <Clock className="h-4 w-4 shrink-0" />
        Votre demande est en cours d&apos;examen par nos administrateurs.
      </span>
    </div>
  );
}
