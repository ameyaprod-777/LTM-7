"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_TICKET_CATEGORY,
  TICKET_CATEGORY_LABELS,
  type TicketCategorySlug,
} from "@/lib/ticket";

type BookingOption = {
  id: string;
  listing: { title: string };
  startDate: string;
  status: string;
};

export function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<TicketCategorySlug>(
    DEFAULT_TICKET_CATEGORY
  );
  const [bookingId, setBookingId] = useState("");
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/bookings?role=lister").then((r) => r.json()),
    ]).then(([asRenter, asLister]) => {
      const merged = [
        ...(Array.isArray(asRenter) ? asRenter : []),
        ...(Array.isArray(asLister) ? asLister : []),
      ] as BookingOption[];
      const byId = new Map(merged.map((b) => [b.id, b]));
      setBookings(Array.from(byId.values()));
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        body,
        category,
        bookingId: bookingId || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      const ticket = await res.json();
      router.push(`/dashboard/support/${ticket.id}`);
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Impossible d'ouvrir le ticket.");
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 max-w-lg space-y-4 rounded-xl border border-anthracite-100 p-5"
    >
      <div>
        <Label>Sujet</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>Catégorie</Label>
        <select
          className="mt-1 w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as TicketCategorySlug)}
        >
          {(
            Object.entries(TICKET_CATEGORY_LABELS) as [TicketCategorySlug, string][]
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {bookings.length > 0 && (
        <div>
          <Label>Réservation liée (optionnel)</Label>
          <select
            className="mt-1 w-full rounded-lg border border-anthracite-200 px-3 py-2 text-sm"
            value={bookingId}
            onChange={(e) => {
              setBookingId(e.target.value);
              if (e.target.value) setCategory("BOOKING_DISPUTE");
            }}
          >
            <option value="">— Aucune —</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.listing.title} (
                {new Date(b.startDate).toLocaleDateString("fr-FR")})
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <Label>Message</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={loading}>
        Ouvrir un ticket
      </Button>
    </form>
  );
}
