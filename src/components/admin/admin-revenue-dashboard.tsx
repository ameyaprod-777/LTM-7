"use client";

type ChartPoint = { label: string; euros: number };

export function AdminRevenueDashboard({
  totalCommissionEur,
  completedBookings,
  heldPaymentsCount,
  heldAmountEur,
  heldCommissionEur,
  releasedVolumeEur,
  activeBookings,
  monthlyChart,
}: {
  totalCommissionEur: number;
  completedBookings: number;
  heldPaymentsCount: number;
  heldAmountEur: number;
  heldCommissionEur: number;
  releasedVolumeEur: number;
  activeBookings: number;
  monthlyChart: ChartPoint[];
}) {
  const maxEuros = Math.max(...monthlyChart.map((p) => p.euros), 1);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="CA commissions" value={`${totalCommissionEur.toFixed(0)} €`} sub={`${completedBookings} résa. terminées`} />
        <StatCard label="Paiements en attente (HELD)" value={`${heldAmountEur.toFixed(0)} €`} sub={`${heldPaymentsCount} · comm. ${heldCommissionEur.toFixed(0)} €`} />
        <StatCard label="Volume libéré" value={`${releasedVolumeEur.toFixed(0)} €`} />
        <StatCard label="Résa. actives" value={String(activeBookings)} />
      </div>

      <div className="rounded-2xl border border-anthracite-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-anthracite">
          Commissions — 6 derniers mois
        </h2>
        <div className="mt-6 flex h-48 items-end gap-2">
          {monthlyChart.map((p) => (
            <div key={p.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t bg-accent transition-all"
                style={{ height: `${Math.max(4, (p.euros / maxEuros) * 160)}px` }}
                title={`${p.euros.toFixed(0)} €`}
              />
              <span className="text-[10px] text-anthracite-500">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-anthracite-100 bg-white p-5">
      <p className="text-sm text-anthracite-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-anthracite">{value}</p>
      {sub && <p className="mt-1 text-xs text-anthracite-400">{sub}</p>}
    </div>
  );
}
