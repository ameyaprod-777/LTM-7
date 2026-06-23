import { Resend } from "resend";
import {
  generateInvoicePdf,
  buildInvoiceNumber,
  type InvoiceData,
} from "@/lib/invoice-pdf";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM =
  process.env.EMAIL_FROM ?? "LoueTonMatos <support@louetonmatos.fr>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "support@louetonmatos.fr";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function areEmailNotificationsEnabled() {
  return (
    isEmailConfigured() &&
    process.env.EMAIL_NOTIFICATIONS_ENABLED !== "false"
  );
}

export function isDeliverableEmail(email: string | null | undefined) {
  return Boolean(email && !email.endsWith("@louetonmatos.invalid"));
}

type Attachment = { filename: string; content: Buffer };

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}) {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log("[email:dev]", { to, subject });
    }
    return { ok: true as const, dev: true };
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject,
    html,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  if (error) {
    console.error("[email]", error);
    return { ok: false as const, error };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[email:sent]", { to, subject });
  }

  return { ok: true as const };
}

function appUrl(path: string) {
  const base =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

export function membershipApprovedEmail(name: string) {
  return `
    <h1>Bienvenue dans la communauté LoueTonMatos</h1>
    <p>Bonjour ${name},</p>
    <p>Votre demande d'adhésion a été <strong>approuvée</strong>. Vous pouvez dès maintenant louer et proposer du matériel.</p>
    <p><a href="${appUrl("/dashboard")}">Accéder à mon tableau de bord</a></p>
  `;
}

export function membershipRejectedEmail(name: string, message?: string) {
  return `
    <h1>Mise à jour de votre demande</h1>
    <p>Bonjour ${name},</p>
    <p>Votre demande d'adhésion n'a pas été retenue pour le moment.</p>
    ${message ? `<p><em>Message de l'équipe : ${message}</em></p>` : ""}
    <p>Vous pouvez nous contacter pour plus d'informations.</p>
  `;
}

export function membershipIncompleteEmail(name: string, message: string) {
  return `
    <h1>Pièces complémentaires requises</h1>
    <p>Bonjour ${name},</p>
    <p>Votre candidature nécessite des documents ou informations supplémentaires :</p>
    <p><em>${message}</em></p>
    <p><a href="${appUrl("/apply")}">Compléter ma candidature</a></p>
  `;
}

export function adminNewApplicationEmail(applicantName: string, applicantEmail: string) {
  return `
    <h1>Nouvelle demande d'adhésion</h1>
    <p><strong>${applicantName}</strong> (${applicantEmail}) vient de soumettre une candidature.</p>
    <p><a href="${appUrl("/admin/membership")}">Examiner la demande</a></p>
  `;
}

export function passwordResetEmail(name: string | null, token: string, email: string) {
  const link = appUrl(
    `/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
  );
  return `
    <h1>Réinitialisation du mot de passe</h1>
    <p>Bonjour${name ? ` ${name}` : ""},</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe LoueTonMatos.</p>
    <p><a href="${link}">Choisir un nouveau mot de passe</a></p>
    <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  `;
}

export function newMessageEmail(
  recipientName: string,
  senderName: string,
  preview: string,
  conversationId: string
) {
  const safe = preview.slice(0, 300).replace(/</g, "&lt;");
  return `
    <h1>Nouveau message</h1>
    <p>Bonjour ${recipientName},</p>
    <p><strong>${senderName}</strong> vous a envoyé un message :</p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#444">${safe}</blockquote>
    <p><a href="${appUrl(`/dashboard/messages/${conversationId}`)}">Répondre sur LoueTonMatos</a></p>
  `;
}

export function ticketStaffReplyEmail(
  recipientName: string | null,
  subject: string,
  preview: string,
  ticketId: string
) {
  const safe = preview.slice(0, 500).replace(/</g, "&lt;");
  return `
    <h1>Réponse de l'équipe support</h1>
    <p>Bonjour${recipientName ? ` ${recipientName}` : ""},</p>
    <p>Nous avons répondu à votre ticket <strong>${subject.replace(/</g, "&lt;")}</strong> :</p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#444">${safe}</blockquote>
    <p><a href="${appUrl(`/dashboard/support/${ticketId}`)}">Voir la conversation</a></p>
  `;
}

export function notificationEmail(
  recipientName: string | null,
  title: string,
  body?: string,
  link?: string
) {
  const safeTitle = title.replace(/</g, "&lt;");
  const safeBody = body?.replace(/</g, "&lt;") ?? "";
  const cta = link ? appUrl(link.startsWith("/") ? link : `/${link}`) : appUrl("/dashboard");

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#1a1a1a">
      <p style="margin:0 0 16px">Bonjour${recipientName ? ` ${recipientName.replace(/</g, "&lt;")}` : ""},</p>
      <h1 style="font-size:20px;margin:0 0 12px">${safeTitle}</h1>
      ${safeBody ? `<p style="margin:0 0 16px;color:#444">${safeBody}</p>` : ""}
      <p style="margin:24px 0 0">
        <a href="${cta}" style="display:inline-block;background:#c45c26;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Voir sur LoueTonMatos
        </a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#888">
        Vous recevez cet email car une activité a eu lieu sur votre compte LoueTonMatos.
      </p>
    </div>
  `;
}

// ─── Booking emails ───────────────────────────────────────────────────────────

export function bookingRequestEmail(
  listerName: string,
  renterName: string,
  listingTitle: string,
  startDate: string,
  endDate: string,
  totalEuros: string
) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#1a1a1a">
      <h1 style="font-size:20px;margin:0 0 12px">Nouvelle demande de location</h1>
      <p>Bonjour ${listerName.replace(/</g, "&lt;")},</p>
      <p><strong>${renterName.replace(/</g, "&lt;")}</strong> souhaite louer votre matériel :</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#555">Annonce</td><td style="padding:6px 0;font-weight:600">${listingTitle.replace(/</g, "&lt;")}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Du</td><td style="padding:6px 0">${startDate}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Au</td><td style="padding:6px 0">${endDate}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Total locataire</td><td style="padding:6px 0;font-weight:600">${totalEuros} €</td></tr>
      </table>
      <p style="margin:24px 0 0">
        <a href="${appUrl("/dashboard/bookings?role=lister")}" style="display:inline-block;background:#c45c26;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Approuver ou refuser
        </a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#888">La demande expire si vous ne répondez pas sous 48 h.</p>
    </div>
  `;
}

export function bookingApprovedEmail(
  renterName: string,
  listingTitle: string,
  startDate: string,
  endDate: string,
  totalEuros: string
) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#1a1a1a">
      <h1 style="font-size:20px;margin:0 0 12px">Votre demande a été approuvée ✓</h1>
      <p>Bonjour ${renterName.replace(/</g, "&lt;")},</p>
      <p>Le loueur a accepté votre demande pour <strong>${listingTitle.replace(/</g, "&lt;")}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#555">Dates</td><td style="padding:6px 0">${startDate} → ${endDate}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Montant à payer</td><td style="padding:6px 0;font-weight:600">${totalEuros} €</td></tr>
      </table>
      <p style="margin:24px 0 0">
        <a href="${appUrl("/dashboard/bookings")}" style="display:inline-block;background:#c45c26;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Procéder au paiement
        </a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#888">La réservation ne sera effective qu'après paiement.</p>
    </div>
  `;
}

export function bookingConfirmedRenterEmail(
  renterName: string,
  listingTitle: string,
  startDate: string,
  endDate: string,
  listerName: string
) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#1a1a1a">
      <h1 style="font-size:20px;margin:0 0 12px">Réservation confirmée 🎉</h1>
      <p>Bonjour ${renterName.replace(/</g, "&lt;")},</p>
      <p>Votre paiement a bien été reçu. La location est confirmée !</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#555">Matériel</td><td style="padding:6px 0;font-weight:600">${listingTitle.replace(/</g, "&lt;")}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Dates</td><td style="padding:6px 0">${startDate} → ${endDate}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Loueur</td><td style="padding:6px 0">${listerName.replace(/</g, "&lt;")}</td></tr>
      </table>
      <p style="margin:24px 0 0">
        <a href="${appUrl("/dashboard/bookings")}" style="display:inline-block;background:#c45c26;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Voir ma réservation
        </a>
      </p>
    </div>
  `;
}

export function bookingConfirmedListerEmail(
  listerName: string,
  listingTitle: string,
  startDate: string,
  endDate: string,
  renterName: string,
  netEuros: string
) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#1a1a1a">
      <h1 style="font-size:20px;margin:0 0 12px">Paiement reçu — location confirmée ✓</h1>
      <p>Bonjour ${listerName.replace(/</g, "&lt;")},</p>
      <p>Le paiement de <strong>${renterName.replace(/</g, "&lt;")}</strong> a été encaissé. La location de votre matériel est confirmée.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#555">Matériel</td><td style="padding:6px 0;font-weight:600">${listingTitle.replace(/</g, "&lt;")}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Dates</td><td style="padding:6px 0">${startDate} → ${endDate}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Votre revenu net</td><td style="padding:6px 0;font-weight:600">${netEuros} €</td></tr>
      </table>
      <p style="margin:24px 0 0">
        <a href="${appUrl("/dashboard/bookings?role=lister")}" style="display:inline-block;background:#c45c26;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Voir mes locations
        </a>
      </p>
    </div>
  `;
}

export function bookingCancelledEmail(
  recipientName: string,
  listingTitle: string,
  startDate: string,
  endDate: string,
  refundLabel: string,
  cancelledByRenter: boolean
) {
  const who = cancelledByRenter ? "Le locataire" : "Le loueur";
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#1a1a1a">
      <h1 style="font-size:20px;margin:0 0 12px">Réservation annulée</h1>
      <p>Bonjour ${recipientName.replace(/</g, "&lt;")},</p>
      <p>${who} a annulé la réservation suivante :</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#555">Matériel</td><td style="padding:6px 0;font-weight:600">${listingTitle.replace(/</g, "&lt;")}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Dates</td><td style="padding:6px 0">${startDate} → ${endDate}</td></tr>
        <tr><td style="padding:6px 0;color:#555">Remboursement</td><td style="padding:6px 0">${refundLabel.replace(/</g, "&lt;")}</td></tr>
      </table>
      <p style="margin:24px 0 0">
        <a href="${appUrl("/dashboard/bookings")}" style="display:inline-block;background:#c45c26;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Mes réservations
        </a>
      </p>
    </div>
  `;
}

export function testEmail(recipientName: string | null) {
  return `
    <h1>Test d'envoi LoueTonMatos</h1>
    <p>Bonjour${recipientName ? ` ${recipientName}` : ""},</p>
    <p>Si vous lisez ce message, la configuration <strong>Resend</strong> fonctionne correctement.</p>
    <p>Les notifications de la plateforme (devis, réservations, messages, etc.) pourront vous être envoyées par email.</p>
    <p><a href="${appUrl("/dashboard")}">Retour au tableau de bord</a></p>
  `;
}

export function emailVerificationEmail(name: string | null, token: string, email: string) {
  const link = appUrl(
    `/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
  );
  return `
    <h1>Confirmez votre adresse email</h1>
    <p>Bonjour${name ? ` ${name}` : ""},</p>
    <p>Merci de rejoindre LoueTonMatos. Cliquez sur le lien ci-dessous pour activer votre compte :</p>
    <p><a href="${link}">Vérifier mon email</a></p>
    <p>Ce lien expire dans 24 heures.</p>
  `;
}

// ─── Invoice sender ───────────────────────────────────────────────────────────

export async function sendBookingInvoice(invoice: InvoiceData) {
  if (!areEmailNotificationsEnabled()) return;

  const number = buildInvoiceNumber(invoice.booking.id, invoice.issuedAt);
  const fullInvoice: InvoiceData = { ...invoice, invoiceNumber: number };

  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = await generateInvoicePdf(fullInvoice);
  } catch (err) {
    console.error("[invoice] PDF generation failed", err);
    return;
  }

  const attachment = {
    filename: `facture-${number}.pdf`,
    content: pdfBuffer,
  };

  const { booking, renter, lister } = invoice;
  const startStr = booking.startDate.toLocaleDateString("fr-FR");
  const endStr = booking.endDate.toLocaleDateString("fr-FR");
  const totalStr = (booking.totalAmount / 100).toFixed(0);
  const netStr = ((booking.rentalFee + booking.deliveryFee) / 100).toFixed(0);

  if (isDeliverableEmail(renter.email)) {
    await sendEmail({
      to: renter.email,
      subject: `Votre facture LoueTonMatos — ${booking.listingTitle}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;color:#1a1a1a">
          <h1 style="font-size:20px;margin:0 0 12px">Votre facture est disponible</h1>
          <p>Bonjour ${renter.name.replace(/</g, "&lt;")},</p>
          <p>La location de <strong>${booking.listingTitle.replace(/</g, "&lt;")}</strong>
             du ${startStr} au ${endStr} est confirmée.</p>
          <p>Retrouvez votre facture (N° ${number}) en pièce jointe.
             <strong>Total réglé : ${totalStr} €</strong>.</p>
          <p style="margin:24px 0 0">
            <a href="${appUrl("/dashboard/bookings")}"
               style="display:inline-block;background:#c45c26;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Voir ma réservation
            </a>
          </p>
        </div>
      `,
      attachments: [attachment],
    });
  }

  if (isDeliverableEmail(lister.email)) {
    await sendEmail({
      to: lister.email,
      subject: `Paiement reçu — ${booking.listingTitle}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;color:#1a1a1a">
          <h1 style="font-size:20px;margin:0 0 12px">Paiement reçu ✓</h1>
          <p>Bonjour ${lister.name.replace(/</g, "&lt;")},</p>
          <p>Le paiement pour <strong>${booking.listingTitle.replace(/</g, "&lt;")}</strong>
             (${startStr} → ${endStr}) a bien été encaissé.</p>
          <p>Votre revenu net : <strong>${netStr} €</strong>
             (versé à la clôture de la location).</p>
          <p>La facture locataire (N° ${number}) est en pièce jointe pour vos archives.</p>
          <p style="margin:24px 0 0">
            <a href="${appUrl("/dashboard/bookings?role=lister")}"
               style="display:inline-block;background:#c45c26;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Voir mes locations
            </a>
          </p>
        </div>
      `,
      attachments: [attachment],
    });
  }
}
