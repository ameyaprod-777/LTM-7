import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoProvider } from "@/lib/video-embed";

type Props = {
  href: string;
  title: string;
  thumbnailUrl: string | null;
  provider?: VideoProvider | null;
  className?: string;
};

/** Miniature YouTube/Vimeo cliquable → ouvre la vidéo dans un nouvel onglet. */
export function VideoThumbnailLink({
  href,
  title,
  thumbnailUrl,
  provider,
  className,
}: Props) {
  const label =
    provider === "youtube"
      ? "Voir sur YouTube"
      : provider === "vimeo"
        ? "Voir sur Vimeo"
        : "Voir la vidéo";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative block aspect-video overflow-hidden bg-anthracite-900",
        className
      )}
      aria-label={`${title} — ${label}`}
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-anthracite-800 to-anthracite-950" />
      )}
      <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/40" />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-anthracite shadow-lg transition-transform group-hover:scale-110">
          <Play className="h-6 w-6 fill-current translate-x-0.5" aria-hidden />
        </span>
        <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {label}
        </span>
      </span>
    </a>
  );
}
