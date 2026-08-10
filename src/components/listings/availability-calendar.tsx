"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isDateBlocked } from "@/lib/listing-availability-shared";

type Availability = {
  blocked: string[];
  booked: { start: string; end: string }[];
};

type Props = {
  listingId?: string;
  serviceId?: string;
  editable?: boolean;
};

export function AvailabilityCalendar({
  listingId,
  serviceId,
  editable = false,
}: Props) {
  const apiBase = listingId
    ? `/api/listings/${listingId}/blocked-dates`
    : `/api/services/${serviceId}/blocked-dates`;
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [availability, setAvailability] = useState<Availability>({
    blocked: [],
    booked: [],
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(apiBase);
    const json = await res.json();
    setLoading(false);
    if (res.ok) {
      setAvailability(json);
    }
  }, [apiBase]);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const toggle = async (dateKey: string) => {
    if (!editable) return;
    const isBlockedDay = availability.blocked.includes(dateKey);
    if (isBlockedDay) {
      await fetch(`${apiBase}/${dateKey}`, {
        method: "DELETE",
      });
    } else {
      await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey }),
      });
    }
    void load();
  };

  const startPad = startOfMonth(month).getDay();
  const pad = startPad === 0 ? 6 : startPad - 1;

  return (
    <div className="overflow-x-auto rounded-xl border border-anthracite-100 bg-white p-3 sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-anthracite">
          {editable ? "Calendrier de disponibilité" : "Disponibilité"}
        </h3>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="rounded-lg p-2 hover:bg-anthracite-50"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-0 flex-1 text-center text-sm font-medium capitalize sm:min-w-[140px] sm:flex-none">
            {format(month, "MMMM yyyy", { locale: fr })}
          </span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded-lg p-2 hover:bg-anthracite-50"
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editable && (
        <p className="mb-3 text-xs text-anthracite-500">
          Cliquez sur un jour pour le bloquer ou le débloquer. Les jours réservés
          ne sont pas modifiables.
        </p>
      )}

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-anthracite-400">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: pad }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const blocked = availability.blocked.includes(key);
          const booked = isDateBlocked(key, [], availability.booked);
          const unavailable = blocked || booked;

          return (
            <button
              key={key}
              type="button"
              disabled={!editable || booked || loading || !inMonth}
              onClick={() => void toggle(key)}
              title={
                unavailable
                  ? blocked
                    ? "Bloqué"
                    : "Réservé"
                  : "Disponible"
              }
              className={`aspect-square rounded-md text-xs transition ${
                !inMonth ? "opacity-30" : ""
              } ${
                blocked
                  ? "bg-red-100 text-red-800 font-semibold"
                  : booked
                    ? "bg-amber-100 text-amber-900"
                    : "bg-anthracite-50 text-anthracite-700 hover:bg-anthracite-100"
              } ${editable && !booked && inMonth ? "cursor-pointer" : "cursor-default"}`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-anthracite-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-red-100" /> Bloqué
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-amber-100" /> Réservé
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-anthracite-50" /> Disponible
        </span>
      </div>
    </div>
  );
}
