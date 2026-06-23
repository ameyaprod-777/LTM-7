import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: Props) {
  return (
    <div
      role="status"
      className="flex flex-col items-center rounded-2xl border border-dashed border-anthracite-200 bg-anthracite-50/50 px-6 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
        <Icon className="h-7 w-7 text-anthracite-300" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-anthracite">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-anthracite-500">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {action && (
            <Link href={action.href}>
              <Button>{action.label}</Button>
            </Link>
          )}
          {secondaryAction && (
            <Link href={secondaryAction.href}>
              <Button variant="outline">{secondaryAction.label}</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
