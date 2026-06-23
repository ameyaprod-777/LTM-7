import { Skeleton } from "@/components/ui/skeleton";
import { ConversationsListSkeleton } from "@/components/messages/conversations-list-skeleton";

export default function MessagesLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <ConversationsListSkeleton />
    </div>
  );
}
