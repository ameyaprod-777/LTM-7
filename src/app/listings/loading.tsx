import { Skeleton } from "@/components/ui/skeleton";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";

export default function ListingsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-2 h-5 w-72 max-w-full" />
      <Skeleton className="mt-8 h-28 w-full rounded-2xl" />
      <div className="mt-8">
        <ListingsGridSkeleton />
      </div>
    </div>
  );
}
