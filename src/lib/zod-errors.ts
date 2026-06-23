import type { ZodError } from "zod";

/** Extrait un message lisible depuis une erreur API (string ou fieldErrors Zod). */
export function formatApiError(error: unknown): string {
  if (typeof error === "string") {
    return error.replace(/^Invalid input:?\s*/i, "Donnée invalide : ");
  }
  if (error && typeof error === "object") {
    const parts = Object.entries(error as Record<string, string[] | string>)
      .flatMap(([key, val]) => {
        if (Array.isArray(val)) {
          return val.map((m) => formatFieldLabel(key, m));
        }
        if (typeof val === "string") return [formatFieldLabel(key, val)];
        return [];
      });
    if (parts.length > 0) return parts.join(" · ");
  }
  return "Erreur lors de l'envoi";
}

function formatFieldLabel(key: string, message: string): string {
  const labels: Record<string, string> = {
    brief: "Description",
    startDate: "Date de début",
    endDate: "Date de fin",
    proposedAmount: "Budget",
    acceptServiceTerms: "Conditions",
  };
  const clean = message.replace(/^Invalid input:?\s*/i, "valeur invalide");
  const label = labels[key] ?? key;
  return `${label} : ${clean}`;
}

export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
