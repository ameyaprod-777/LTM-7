import type { Metadata } from "next";

const siteName = "LoueTonMatos";

export function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function buildPageMetadata({
  title,
  description,
  path,
  imageUrl,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  imageUrl?: string | null;
  noIndex?: boolean;
}): Metadata {
  const base = getSiteUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const image = imageUrl?.startsWith("http")
    ? imageUrl
    : imageUrl
      ? `${base}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`
      : `${base}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url,
      siteName,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
