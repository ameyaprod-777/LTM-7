"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { APPLICATION_STATUS_LABELS } from "@/lib/membership-labels";

const TABS: { key: string; label: string }[] = [
  { key: "pending", label: APPLICATION_STATUS_LABELS.PENDING },
  { key: "incomplete", label: APPLICATION_STATUS_LABELS.INCOMPLETE },
  { key: "approved", label: APPLICATION_STATUS_LABELS.APPROVED },
  { key: "rejected", label: APPLICATION_STATUS_LABELS.REJECTED },
  { key: "all", label: "Toutes" },
];

export function MembershipStatusTabs({ counts }: { counts: Record<string, number> }) {
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "pending";

  return (
    <div className="mt-6 flex flex-wrap gap-2 border-b border-anthracite-100 pb-4">
      {TABS.map((tab) => {
        const active = current === tab.key;
        const count = counts[tab.key] ?? 0;
        return (
          <Link
            key={tab.key}
            href={`/admin/membership?status=${tab.key}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-accent text-white"
                : "bg-anthracite-50 text-anthracite-600 hover:bg-anthracite-100"
            }`}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  active ? "bg-white/20" : "bg-anthracite-200"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
