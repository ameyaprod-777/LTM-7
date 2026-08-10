import { parseVideoUrl } from "@/lib/video-embed";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  title?: string;
  className?: string;
};

/** Lecteur embarqué YouTube / Vimeo (ratio 16:9). */
export function VideoEmbed({ url, title = "Vidéo du projet", className }: Props) {
  const parsed = parseVideoUrl(url);
  if (!parsed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "block rounded-lg border border-anthracite-100 bg-anthracite-50 px-4 py-8 text-center text-sm text-accent underline",
          className
        )}
      >
        Voir la vidéo
      </a>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-lg bg-anthracite-900",
        className
      )}
    >
      <iframe
        src={parsed.embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
