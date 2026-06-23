"use client";

import { useEffect, useRef } from "react";

export function ServiceViewTracker({ serviceId }: { serviceId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void fetch(`/api/services/${serviceId}/view`, { method: "POST" });
  }, [serviceId]);

  return null;
}
