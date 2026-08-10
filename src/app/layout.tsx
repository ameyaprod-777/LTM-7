import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Header } from "@/components/layout/header";
import { SkipLink } from "@/components/layout/skip-link";
import { MaintenanceBanner } from "@/components/layout/maintenance-banner";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LoueTonMatos — Louez entre créatifs, en confiance.",
    template: "%s | LoueTonMatos",
  },
  description:
    "Plateforme de location de matériel audiovisuel entre créatifs. Caméras, optiques, lumière, son — en toute confiance.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "LoueTonMatos",
    title: "LoueTonMatos — Louez entre créatifs, en confiance.",
    description:
      "Plateforme de location de matériel audiovisuel entre créatifs.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoueTonMatos",
    description:
      "Location de matériel audiovisuel entre créatifs professionnels.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2a5f9e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} min-h-screen font-sans antialiased`}>
        <AuthSessionProvider>
          <ToastProvider>
            <SkipLink />
            <div className="flex min-h-screen flex-col">
              <MaintenanceBanner />
              <Header />
              <main id="main-content" className="flex-1" tabIndex={-1}>
                {children}
              </main>
              <Footer />
              <CookieBanner />
            </div>
            <RegisterServiceWorker />
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
