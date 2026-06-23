"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DELIVERY_SLOT_LABELS, DELIVERY_TASK_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { DeliveryTaskStatus, DeliverySlot } from "@prisma/client";

type Task = {
  id: string;
  type: string;
  status: DeliveryTaskStatus;
  address: string;
  slot: DeliverySlot | null;
  booking: {
    id: string;
    startDate: string;
    listing: { title: string };
    renter: { name: string | null };
    lister: { name: string | null };
  };
};

const NEXT_STATUS: Partial<Record<DeliveryTaskStatus, DeliveryTaskStatus>> = {
  PENDING: "SCHEDULED",
  SCHEDULED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

export function DeliveryTasksList({ asLister }: { asLister: boolean }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/deliveries?role=${asLister ? "lister" : "renter"}`);
    const json = await res.json();
    setLoading(false);
    if (res.ok) setTasks(json);
  }, [asLister]);

  useEffect(() => {
    void load();
  }, [load]);

  const advance = async (taskId: string, status: DeliveryTaskStatus) => {
    await fetch(`/api/deliveries?id=${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void load();
    router.refresh();
  };

  if (loading) {
    return <p className="text-sm text-anthracite-400">Chargement…</p>;
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-anthracite-400">Aucune livraison planifiée.</p>;
  }

  return (
    <ul className="space-y-4">
      {tasks.map((t) => {
        const next = NEXT_STATUS[t.status];
        return (
          <li
            key={t.id}
            className="rounded-xl border border-anthracite-100 bg-white p-4"
          >
            <p className="font-medium text-anthracite">{t.booking.listing.title}</p>
            <p className="text-sm text-anthracite-500">
              {formatDate(t.booking.startDate)} · {t.address}
            </p>
            {t.slot && (
              <p className="text-xs text-anthracite-400">
                Créneau : {DELIVERY_SLOT_LABELS[t.slot]}
              </p>
            )}
            <p className="mt-1 text-xs">
              <span className="rounded-full bg-anthracite-100 px-2 py-0.5">
                {DELIVERY_TASK_STATUS_LABELS[t.status]}
              </span>
            </p>
            <p className="mt-1 text-xs text-anthracite-400">
              {asLister
                ? `Locataire : ${t.booking.renter.name ?? "—"}`
                : `Loueur : ${t.booking.lister.name ?? "—"}`}
            </p>
            {asLister && next && (
              <Button
                size="sm"
                className="mt-3"
                onClick={() => void advance(t.id, next)}
              >
                → {DELIVERY_TASK_STATUS_LABELS[next]}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
