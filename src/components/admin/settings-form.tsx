"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AdminSettingsForm({
  commissionRate,
  invitationsEnabled,
  registrationClosed,
  maintenanceBanner,
  maintenanceBannerEnabled,
}: {
  commissionRate: number;
  invitationsEnabled: boolean;
  registrationClosed: boolean;
  maintenanceBanner: string;
  maintenanceBannerEnabled: boolean;
}) {
  const router = useRouter();
  const [rate, setRate] = useState(String(commissionRate * 100));
  const [invites, setInvites] = useState(invitationsEnabled);
  const [regClosed, setRegClosed] = useState(registrationClosed);
  const [banner, setBanner] = useState(maintenanceBanner);
  const [bannerOn, setBannerOn] = useState(maintenanceBannerEnabled);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commissionRate: Number(rate) / 100,
        invitationsEnabled: invites,
        registrationClosed: regClosed,
        maintenanceBanner: banner || null,
        maintenanceBannerEnabled: bannerOn,
      }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="space-y-5 rounded-2xl border border-anthracite-100 bg-white p-5">
      <h2 className="font-semibold text-anthracite">Paramètres généraux</h2>
      <div>
        <Label>Commission plateforme (%)</Label>
        <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={invites} onChange={(e) => setInvites(e.target.checked)} />
        Invitations membres activées
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={regClosed} onChange={(e) => setRegClosed(e.target.checked)} />
        Inscriptions fermées (nouveaux comptes refusés)
      </label>
      <div className="border-t border-anthracite-100 pt-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={bannerOn} onChange={(e) => setBannerOn(e.target.checked)} />
          Bannière de maintenance visible
        </label>
        <Textarea
          className="mt-2"
          value={banner}
          onChange={(e) => setBanner(e.target.value)}
          rows={3}
          placeholder="Message affiché en haut du site…"
        />
      </div>
      <Button onClick={save} loading={loading}>
        Enregistrer
      </Button>
    </div>
  );
}
