import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/LTM-logo-noback2.png"
        alt="LoueTonMatos"
        width={40}
        height={40}
        className="h-9 w-9 shrink-0 object-contain"
        priority
      />
      <span className="text-lg font-bold tracking-tight text-anthracite">
        Loue<span className="text-accent">Ton</span>Matos
      </span>
    </Link>
  );
}
