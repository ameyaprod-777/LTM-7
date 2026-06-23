import { Skeleton } from "@/components/ui/skeleton";

export function ConversationsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="mt-6 space-y-2" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-xl border border-anthracite-100 p-4"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
