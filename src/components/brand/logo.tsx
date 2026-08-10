import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compactOnMobile = false,
}: {
  className?: string;
  compactOnMobile?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("flex min-w-0 items-center gap-2 sm:gap-2.5", className)}
    >
      <Image
        src="/LTM-logo-noback2.png"
        alt="LoueTonMatos"
        width={40}
        height={40}
        className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
        priority
      />
      <span
        className={cn(
          "truncate text-base font-bold tracking-tight text-anthracite sm:text-lg",
          compactOnMobile && "hidden sm:inline"
        )}
      >
        Loue<span className="text-accent">Ton</span>Matos
      </span>
    </Link>
  );
}
