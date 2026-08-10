import { readFileSync } from "fs";
import path from "path";

const PLATFORM_NAME =
  process.env.NEXT_PUBLIC_LEGAL_COMPANY_NAME?.trim() || "LoueTonMatos";

let cachedTemplate: string | null = null;

export function appBaseUrl() {
  const base =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  return base.replace(/\/$/, "");
}

export function appUrl(pathname: string) {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${appBaseUrl()}${p}`;
}

function loadTemplate() {
  if (cachedTemplate) return cachedTemplate;
  const filePath = path.join(
    process.cwd(),
    "public",
    "mail",
    "email-template-marketplace.html"
  );
  cachedTemplate = readFileSync(filePath, "utf8");
  return cachedTemplate;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function firstNameFrom(name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return "créatif";
  return escapeHtml(trimmed.split(/\s+/)[0] ?? trimmed);
}

export type MarketplaceEmailInput = {
  subject: string;
  /** Texte préheader (aperçu boîte mail) */
  preheader?: string;
  /** Petite ligne au-dessus du titre (ex. Compte, Location…) */
  eyebrow?: string;
  /** Titre dans le bandeau */
  title: string;
  /** Nom complet ou prénom — seul le prénom est affiché */
  recipientName?: string | null;
  /** HTML du corps (sans « Bonjour … ») */
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

/**
 * Remplit `public/mail/email-template-marketplace.html`
 * pour tous les emails transactionnels LoueTonMatos.
 */
export function renderMarketplaceEmail(input: MarketplaceEmailInput): string {
  let html = loadTemplate();

  const site = appBaseUrl();
  const address =
    process.env.NEXT_PUBLIC_LEGAL_ADDRESS?.trim() ||
    "France";
  const instagram =
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() ||
    `${site}/`;
  const youtube =
    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE?.trim() ||
    `${site}/`;
  const linkedin =
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN?.trim() ||
    `${site}/`;

  const hasCta = Boolean(input.ctaLabel?.trim() && input.ctaUrl?.trim());
  if (!hasCta) {
    html = html.replace(
      /<!-- CTA_START -->[\s\S]*?<!-- CTA_END -->/,
      ""
    );
  }

  const map: Record<string, string> = {
    "{{OBJET_EMAIL}}": escapeHtml(input.subject),
    "{{PREHEADER}}": escapeHtml(input.preheader ?? input.title),
    "{{NOM_PLATEFORME}}": escapeHtml(PLATFORM_NAME),
    "{{URL_SITE}}": site,
    "{{URL_LOGO}}": `${site}/LTM-logo-noback2.png`,
    "{{URL_EXPLORER}}": `${site}/listings`,
    "{{SURTITRE}}": escapeHtml(input.eyebrow ?? "LoueTonMatos"),
    "{{TITRE_PRINCIPAL}}": escapeHtml(input.title),
    "{{PRENOM}}": firstNameFrom(input.recipientName),
    "{{CORPS_MESSAGE}}": input.bodyHtml,
    "{{URL_CTA}}": input.ctaUrl ?? `${site}/dashboard`,
    "{{TEXTE_CTA}}": escapeHtml(input.ctaLabel ?? "Ouvrir LoueTonMatos"),
    "{{URL_ITEM_1}}": `${site}/listings`,
    "{{CATEGORIE_ITEM_1}}": "Location",
    "{{TITRE_ITEM_1}}": "Parcourir les annonces",
    "{{PRIX_ITEM_1}}": "Caméras, optiques, lumière…",
    "{{URL_ITEM_2}}": `${site}/services`,
    "{{CATEGORIE_ITEM_2}}": "Services",
    "{{TITRE_ITEM_2}}": "Trouver un prestataire",
    "{{PRIX_ITEM_2}}": "Tournage, montage, son…",
    "{{URL_INSTAGRAM}}": instagram,
    "{{URL_YOUTUBE}}": youtube,
    "{{URL_LINKEDIN}}": linkedin,
    "{{ADRESSE_SOCIETE}}": escapeHtml(address),
    "{{URL_PREFERENCES}}": `${site}/dashboard/settings`,
    "{{URL_SUPPORT}}": `${site}/dashboard/support`,
    "{{URL_DESABONNEMENT}}": `${site}/dashboard/settings`,
  };

  for (const [key, value] of Object.entries(map)) {
    html = html.split(key).join(value);
  }

  return html;
}

/** Petit tableau récapitulatif pour les emails de réservation */
export function emailDetailsTable(
  rows: { label: string; value: string }[]
) {
  const cells = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 0;color:#6b7280;font-size:15px;width:40%;">${escapeHtml(r.label)}</td>
        <td style="padding:8px 0;color:#1a1d24;font-size:15px;font-weight:600;">${escapeHtml(r.value)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px 0;">${cells}</table>`;
}
