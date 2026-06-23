"use client";

import { useEffect, useRef } from "react";

export function ListingViewTracker({ listingId }: { listingId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void fetch(`/api/listings/${listingId}/view`, { method: "POST" });
  }, [listingId]);

  return null;
}
