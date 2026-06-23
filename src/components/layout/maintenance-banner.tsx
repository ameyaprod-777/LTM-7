import { getPlatformSettings } from "@/lib/platform-settings";

export async function MaintenanceBanner() {
  const settings = await getPlatformSettings();
  if (!settings?.maintenanceBannerEnabled || !settings.maintenanceBanner?.trim()) {
    return null;
  }

  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950"
    >
      {settings.maintenanceBanner}
    </div>
  );
}
