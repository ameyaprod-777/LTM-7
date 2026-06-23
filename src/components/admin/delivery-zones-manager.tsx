"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Zone = {
  id: string;
  name: string;
  city: string;
  districts: string[];
  active: boolean;
};

export function DeliveryZonesManager({ zones: initial }: { zones: Zone[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [districts, setDistricts] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/admin/delivery-zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        city,
        districts: districts.split(",").map((d) => d.trim()).filter(Boolean),
        active: true,
      }),
    });
    setLoading(false);
    setName("");
    setCity("");
    setDistricts("");
    router.refresh();
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`/api/admin/delivery-zones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette zone ?")) return;
    await fetch(`/api/admin/delivery-zones/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="rounded-2xl border border-anthracite-100 bg-white p-5 space-y-3">
        <h2 className="font-semibold text-anthracite">Nouvelle zone</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Ville</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
        </div>
        <div>
          <Label>Quartiers (séparés par des virgules)</Label>
          <Input value={districts} onChange={(e) => setDistricts(e.target.value)} placeholder="Marais, Bastille…" />
        </div>
        <Button type="submit" loading={loading}>
          Ajouter
        </Button>
      </form>

      <ul className="space-y-2">
        {initial.map((z) => (
          <li
            key={z.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-anthracite-100 bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-anthracite">
                {z.name} — {z.city}
              </p>
              {z.districts.length > 0 && (
                <p className="text-xs text-anthracite-500">{z.districts.join(", ")}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void toggle(z.id, z.active)}>
                {z.active ? "Désactiver" : "Activer"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => void remove(z.id)}>
                Supprimer
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
