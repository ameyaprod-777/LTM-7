"use client";

import Link from "next/link";
import { DeleteResourceButton } from "@/components/dashboard/delete-resource-button";

export function ServiceRowActions({
  serviceId,
  title,
}: {
  serviceId: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`/services/${serviceId}/edit`}
        className="text-sm text-accent hover:underline"
      >
        Modifier
      </Link>
      <DeleteResourceButton
        kind="service"
        resourceId={serviceId}
        title={title}
      />
    </div>
  );
}
