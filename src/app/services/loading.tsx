import { Skeleton } from "@/components/ui/skeleton";
import { ListingsGridSkeleton } from "@/components/listings/listings-grid-skeleton";

export default function ServicesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-2 h-5 w-64" />
      <div className="mt-8">
        <ListingsGridSkeleton count={6} />
      </div>
    </div>
  );
}
