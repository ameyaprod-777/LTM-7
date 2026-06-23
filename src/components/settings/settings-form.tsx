"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreativeDomain } from "@prisma/client";
import { CREATIVE_DOMAIN_LABELS } from "@/lib/validations/membership";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { useToast } from "@/components/providers/toast-provider";

type UserData = {
  name: string | null;
  email: string;
  city: string | null;
  neighborhood: string | null;
  bio: string | null;
  image: string | null;
  creativeDomain: CreativeDomain | null;
  portfolioUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
};

export function SettingsForm({ user }: { user: UserData }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    name: user.name ?? "",
    city: user.city ?? "",
    neighborhood: user.neighborhood ?? "",
    bio: user.bio ?? "",
    image: user.image ?? "",
    creativeDomain: user.creativeDomain ?? "",
    portfolioUrl: user.portfolioUrl ?? "",
    instagramUrl: user.instagramUrl ?? "",
    websiteUrl: user.websiteUrl ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        creativeDomain: form.creativeDomain || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      success("Profil enregistré");
      router.refresh();
    } else {
      const json = await res.json();
      const msg = typeof json.error === "string" ? json.error : "Erreur";
      setError(msg);
      toastError(msg);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="max-w-lg space-y-4"
    >
      <div>
        <Label>Email</Label>
        <Input value={user.email} disabled />
      </div>

      <AvatarUpload
        currentImage={form.image || null}
        onUploaded={(url) => setForm((f) => ({ ...f, image: url }))}
      />

      <div>
        <Label>Photo (URL alternative)</Label>
        <Input
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          placeholder="https://…"
        />
      </div>

      <div>
        <Label>Nom</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Ville</Label>
          <Input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>
        <div>
          <Label>Quartier</Label>
          <Input
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Domaine créatif</Label>
        <select
          className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          value={form.creativeDomain}
          onChange={(e) =>
            setForm({ ...form, creativeDomain: e.target.value })
          }
        >
          <option value="">—</option>
          {Object.entries(CREATIVE_DOMAIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Bio</Label>
        <Textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label>Portfolio</Label>
        <Input
          value={form.portfolioUrl}
          onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
        />
      </div>
      <div>
        <Label>Instagram</Label>
        <Input
          value={form.instagramUrl}
          onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
        />
      </div>
      <div>
        <Label>Site web</Label>
        <Input
          value={form.websiteUrl}
          onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Profil enregistré.</p>}
      <Button type="submit" loading={loading}>
        Enregistrer
      </Button>
    </form>
  );
}
