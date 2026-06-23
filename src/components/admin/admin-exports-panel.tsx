"use client";

const EXPORTS = [
  { type: "members", label: "Membres (CSV)" },
  { type: "applications", label: "Candidatures (CSV)" },
  { type: "bookings", label: "Réservations (CSV)" },
] as const;

export function AdminExportsPanel() {
  return (
    <div className="rounded-2xl border border-anthracite-100 bg-white p-5">
      <h2 className="font-semibold text-anthracite">Exports CSV</h2>
      <p className="mt-1 text-sm text-anthracite-500">
        Télécharger les données pour analyse externe.
      </p>
      <ul className="mt-4 space-y-2">
        {EXPORTS.map((e) => (
          <li key={e.type}>
            <a
              href={`/api/admin/export/${e.type}`}
              className="inline-flex rounded-lg border border-anthracite-200 px-4 py-2 text-sm font-medium text-anthracite-700 hover:border-accent hover:text-accent"
              download
            >
              {e.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
