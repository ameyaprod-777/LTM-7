import Link from "next/link";
import { Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  showDetails: boolean;
  totalCount: number;
};

export function ListingsPageHeader({ showDetails, totalCount }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-anthracite sm:text-4xl">
          Trouver du matériel
        </h1>
        <p className="mt-2 text-anthracite-500">
          {totalCount > 0
            ? `${totalCount} équipement${totalCount > 1 ? "s" : ""} disponible${totalCount > 1 ? "s" : ""} à la location`
            : "Parcourez le matériel audiovisuel de la communauté"}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        {!showDetails ? (
          <Link href="/register">
            <Button>
              <Lock className="mr-2 h-4 w-4" />
              Rejoindre
            </Button>
          </Link>
        ) : (
          <Link href="/listings/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Proposer
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
