import { formatDateTime } from "@/lib/utils";

type Row = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { name: string | null; email: string };
};

export function AdminAuditTable({ logs }: { logs: Row[] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-anthracite-100 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-anthracite-50 text-anthracite-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Admin</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Cible</th>
            <th className="px-4 py-3">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t border-anthracite-50">
              <td className="px-4 py-3 text-xs text-anthracite-500">
                {formatDateTime(l.createdAt)}
              </td>
              <td className="px-4 py-3 text-anthracite-600">
                {l.admin.name ?? l.admin.email}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
              <td className="px-4 py-3 text-xs text-anthracite-500">
                {l.targetType}
                {l.targetId && (
                  <>
                    <br />
                    <span className="text-anthracite-400">{l.targetId}</span>
                  </>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-anthracite-400">{l.ipAddress ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <p className="py-12 text-center text-anthracite-400">Aucune entrée.</p>
      )}
    </div>
  );
}
