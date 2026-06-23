"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CreativeDomain,
  UserRole,
  UserStatus,
  ApplicationStatus,
} from "@prisma/client";
import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
} from "@/lib/validations/admin-user";
import { CREATIVE_DOMAIN_LABELS } from "@/lib/validations/membership";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BadgeCheck, ExternalLink, Shield, Trash2 } from "lucide-react";

type UserData = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  city: string | null;
  neighborhood: string | null;
  bio: string | null;
  creativeDomain: CreativeDomain | null;
  portfolioUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  verifiedIdentity: boolean;
  memberSince: string | null;
  createdAt: string;
  application: {
    id: string;
    status: ApplicationStatus;
    motivation: string;
    adminMessage: string | null;
    createdAt: string;
    reviewedAt: string | null;
    reviewedBy: { name: string | null } | null;
  } | null;
  _count: {
    listings: number;
    bookingsAsRenter: number;
    bookingsAsLister: number;
    reviewsReceived: number;
  };
};

export function AdminUserEditForm({
  user,
  currentAdminId,
}: {
  user: UserData;
  currentAdminId: string;
}) {
  const router = useRouter();
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
    verifiedIdentity: user.verifiedIdentity,
    role: user.role,
    status: user.status,
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canDelete =
    user.id !== currentAdminId &&
    user.role !== "ADMIN" &&
    user.role !== "MODERATOR";

  const remove = async () => {
    if (
      !confirm(
        `Supprimer définitivement le compte de ${user.name ?? user.email} ? Cette action est irréversible.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Suppression impossible.");
      return;
    }

    router.push("/admin/users");
    router.refresh();
  };

  const save = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        creativeDomain: form.creativeDomain || null,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Erreur de sauvegarde");
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <section className="rounded-2xl border border-anthracite-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-anthracite">Profil public</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nom complet</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
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
            <div className="sm:col-span-2">
              <Label>Photo (URL)</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Domaine créatif</Label>
              <select
                value={form.creativeDomain}
                onChange={(e) =>
                  setForm({ ...form, creativeDomain: e.target.value })
                }
                className="w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm"
              >
                <option value="">—</option>
                {Object.entries(CREATIVE_DOMAIN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
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
          </div>
        </section>

        {user.application && (
          <section className="rounded-2xl border border-anthracite-100 bg-white p-6">
            <h2 className="text-lg font-semibold text-anthracite">
              Candidature d&apos;adhésion
            </h2>
            <p className="mt-1 text-sm text-anthracite-500">
              Statut : <strong>{user.application.status}</strong>
              {user.application.reviewedAt &&
                ` · Traitée le ${formatDate(user.application.reviewedAt)}`}
              {user.application.reviewedBy?.name &&
                ` par ${user.application.reviewedBy.name}`}
            </p>
            <blockquote className="mt-4 border-l-2 border-accent pl-4 text-sm italic text-anthracite-600">
              {user.application.motivation}
            </blockquote>
            {user.application.adminMessage && (
              <p className="mt-3 text-sm text-anthracite-500">
                Message admin : {user.application.adminMessage}
              </p>
            )}
            <Link
              href="/admin/membership"
              className="mt-4 inline-block text-sm text-accent hover:underline"
            >
              Voir la file d&apos;attente →
            </Link>
          </section>
        )}
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-anthracite-100 bg-white p-6">
          <div className="flex flex-col items-center text-center">
            {form.image ? (
              <Image
                src={form.image}
                alt=""
                width={80}
                height={80}
                className="rounded-2xl object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-anthracite-100 text-2xl font-bold">
                {form.name?.[0] ?? "?"}
              </span>
            )}
            <p className="mt-3 font-semibold text-anthracite">{form.name || "Sans nom"}</p>
            <p className="text-sm text-anthracite-500">{user.email}</p>
            <Link
              href={`/profile/${user.id}`}
              target="_blank"
              className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              Voir le profil public <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-anthracite-500">Inscrit le</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            {user.memberSince && (
              <div className="flex justify-between">
                <dt className="text-anthracite-500">Membre depuis</dt>
                <dd>{formatDate(user.memberSince)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-anthracite-500">Annonces</dt>
              <dd>{user._count.listings}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-anthracite-500">Locations</dt>
              <dd>{user._count.bookingsAsRenter}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-anthracite-500">Avis reçus</dt>
              <dd>{user._count.reviewsReceived}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-anthracite-100 bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-anthracite">
            <Shield className="h-5 w-5 text-accent" />
            Accès & certification
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <Label>Rôle communauté</Label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as UserRole })
                }
                className="mt-1 w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm"
              >
                {Object.entries(USER_ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Statut du compte</Label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as UserStatus })
                }
                className="mt-1 w-full rounded-lg border border-anthracite-200 px-4 py-2.5 text-sm"
              >
                {Object.entries(USER_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-anthracite-100 p-4 has-[:checked]:border-accent has-[:checked]:bg-accent-muted/30">
              <input
                type="checkbox"
                checked={form.verifiedIdentity}
                onChange={(e) =>
                  setForm({ ...form, verifiedIdentity: e.target.checked })
                }
                className="mt-1"
              />
              <div>
                <span className="flex items-center gap-2 font-medium text-anthracite">
                  <BadgeCheck className="h-4 w-4 text-accent" />
                  Identité certifiée
                </span>
                <p className="mt-1 text-xs text-anthracite-500">
                  Badge « vérifié » visible sur le profil public. Indépendant du
                  statut membre.
                </p>
              </div>
            </label>
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {saved && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Modifications enregistrées.
          </p>
        )}

        <Button onClick={save} loading={loading} className="w-full">
          Enregistrer les modifications
        </Button>

        {canDelete && (
          <section className="mt-10 rounded-2xl border border-red-200 bg-red-50/50 p-6">
            <h2 className="flex items-center gap-2 font-semibold text-red-900">
              <Trash2 className="h-5 w-5" />
              Zone de danger
            </h2>
            <p className="mt-2 text-sm text-red-800">
              Supprime le compte, anonymise les données personnelles et retire les
              annonces actives. Les réservations passées restent archivées.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
              loading={deleting}
              onClick={remove}
            >
              Supprimer ce profil
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
