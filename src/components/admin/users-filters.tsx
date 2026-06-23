"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AdminUsersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const apply = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    });
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <form
      className="mt-6 flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        apply({ q });
      }}
    >
      <div className="min-w-[200px] flex-1">
        <Input
          placeholder="Rechercher nom, email, ville…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <select
        defaultValue={searchParams.get("role") ?? ""}
        onChange={(e) => apply({ role: e.target.value || null })}
        className="rounded-lg border border-anthracite-200 px-3 py-2.5 text-sm"
      >
        <option value="">Tous les rôles</option>
        <option value="PENDING">En attente</option>
        <option value="MEMBER">Membre</option>
        <option value="ADMIN">Admin</option>
      </select>
      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value || null })}
        className="rounded-lg border border-anthracite-200 px-3 py-2.5 text-sm"
      >
        <option value="">Tous les statuts</option>
        <option value="ACTIVE">Actif</option>
        <option value="SUSPENDED">Suspendu</option>
        <option value="BANNED">Banni</option>
      </select>
      <label className="flex items-center gap-2 text-sm text-anthracite-600">
        <input
          type="checkbox"
          defaultChecked={searchParams.get("certified") === "1"}
          onChange={(e) => apply({ certified: e.target.checked ? "1" : null })}
        />
        Certifiés uniquement
      </label>
      <Button type="submit" variant="outline" size="sm">
        Rechercher
      </Button>
    </form>
  );
}
