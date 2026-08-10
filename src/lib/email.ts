import { Resend } from "resend";
import {
  generateInvoicePdf,
  buildInvoiceNumber,
  type InvoiceData,
} from "@/lib/invoice-pdf";
import {
  appUrl,
  emailDetailsTable,
  escapeHtml,
  renderMarketplaceEmail,
} from "@/lib/email-template";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM =
  process.env.EMAIL_FROM ?? "LoueTonMatos <support@louetonmatos.fr>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "support@louetonmatos.fr";

export { appUrl } from "@/lib/email-template";

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

  try {
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
  } catch (err) {
    console.error("[email] throw", err);
    return { ok: false as const, error: err };
  }
}

export function membershipApprovedEmail(name: string) {
  return renderMarketplaceEmail({
    subject: "Bienvenue dans la communauté LoueTonMatos",
    preheader: "Votre adhésion a été approuvée",
    eyebrow: "Adhésion",
    title: "Bienvenue dans la communauté",
    recipientName: name,
    bodyHtml: `<p style="margin:0 0 12px 0;">Votre demande d'adhésion a été <strong>approuvée</strong>. Vous pouvez dès maintenant louer et proposer du matériel.</p>`,
    ctaLabel: "Accéder à mon tableau de bord",
    ctaUrl: appUrl("/dashboard"),
  });
}

export function membershipRejectedEmail(name: string, message?: string) {
  return renderMarketplaceEmail({
    subject: "Mise à jour de votre demande d'adhésion",
    preheader: "Informations sur votre candidature",
    eyebrow: "Adhésion",
    title: "Mise à jour de votre demande",
    recipientName: name,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Votre demande d'adhésion n'a pas été retenue pour le moment.</p>
      ${
        message
          ? `<p style="margin:0 0 12px 0;"><em>Message de l'équipe : ${escapeHtml(message)}</em></p>`
          : ""
      }
      <p style="margin:0;">Vous pouvez nous contacter pour plus d'informations.</p>
    `,
    ctaLabel: "Contacter le support",
    ctaUrl: appUrl("/dashboard/support"),
  });
}

export function membershipIncompleteEmail(name: string, message: string) {
  return renderMarketplaceEmail({
    subject: "Informations complémentaires requises",
    preheader: "Complétez votre candidature LoueTonMatos",
    eyebrow: "Adhésion",
    title: "Informations complémentaires requises",
    recipientName: name,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Votre candidature nécessite des informations supplémentaires :</p>
      <p style="margin:0;"><em>${escapeHtml(message)}</em></p>
    `,
    ctaLabel: "Compléter ma candidature",
    ctaUrl: appUrl("/apply"),
  });
}

export function adminNewApplicationEmail(
  applicantName: string,
  applicantEmail: string,
  invitationNote?: string | null
) {
  return renderMarketplaceEmail({
    subject: invitationNote
      ? `[Invitation] Candidature — ${applicantName}`
      : `Nouvelle candidature — ${applicantName}`,
    preheader: `${applicantName} a soumis une candidature`,
    eyebrow: "Admin",
    title: "Nouvelle demande d'adhésion",
    recipientName: "Admin",
    bodyHtml: `
      <p style="margin:0 0 12px 0;"><strong>${escapeHtml(applicantName)}</strong> (${escapeHtml(applicantEmail)}) vient de soumettre une candidature.</p>
      ${
        invitationNote
          ? `<p style="margin:0 0 12px 0;"><strong>Invitation :</strong> ${escapeHtml(invitationNote)}</p>`
          : ""
      }
    `,
    ctaLabel: "Examiner la demande",
    ctaUrl: appUrl("/admin/membership"),
  });
}

export function passwordResetEmail(
  name: string | null,
  token: string,
  email: string
) {
  const link = appUrl(
    `/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
  );
  return renderMarketplaceEmail({
    subject: "Réinitialisation de votre mot de passe",
    preheader: "Choisissez un nouveau mot de passe LoueTonMatos",
    eyebrow: "Sécurité",
    title: "Réinitialisation du mot de passe",
    recipientName: name,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Vous avez demandé à réinitialiser votre mot de passe LoueTonMatos.</p>
      <p style="margin:0;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
    ctaLabel: "Choisir un nouveau mot de passe",
    ctaUrl: link,
  });
}

export function newMessageEmail(
  recipientName: string,
  senderName: string,
  preview: string,
  conversationId: string
) {
  const safe = escapeHtml(preview.slice(0, 300));
  return renderMarketplaceEmail({
    subject: `Nouveau message de ${senderName}`,
    preheader: preview.slice(0, 80),
    eyebrow: "Messagerie",
    title: "Nouveau message",
    recipientName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;"><strong>${escapeHtml(senderName)}</strong> vous a envoyé un message :</p>
      <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #2a5f9e;background:#f4f6fb;color:#3f4451;">${safe}</blockquote>
    `,
    ctaLabel: "Répondre sur LoueTonMatos",
    ctaUrl: appUrl(`/dashboard/messages/${conversationId}`),
  });
}

export function ticketStaffReplyEmail(
  recipientName: string | null,
  subject: string,
  preview: string,
  ticketId: string
) {
  const safe = escapeHtml(preview.slice(0, 500));
  return renderMarketplaceEmail({
    subject: `Réponse support — ${subject}`,
    preheader: "L'équipe a répondu à votre ticket",
    eyebrow: "Support",
    title: "Réponse de l'équipe support",
    recipientName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Nous avons répondu à votre ticket <strong>${escapeHtml(subject)}</strong> :</p>
      <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #2a5f9e;background:#f4f6fb;color:#3f4451;">${safe}</blockquote>
    `,
    ctaLabel: "Voir la conversation",
    ctaUrl: appUrl(`/dashboard/support/${ticketId}`),
  });
}

export function notificationEmail(
  recipientName: string | null,
  title: string,
  body?: string,
  link?: string
) {
  const cta = link
    ? appUrl(link.startsWith("/") ? link : `/${link}`)
    : appUrl("/dashboard");

  return renderMarketplaceEmail({
    subject: title,
    preheader: body?.slice(0, 100) ?? title,
    eyebrow: "Notification",
    title,
    recipientName,
    bodyHtml: body
      ? `<p style="margin:0;">${escapeHtml(body)}</p>`
      : `<p style="margin:0;">Une activité a eu lieu sur votre compte LoueTonMatos.</p>`,
    ctaLabel: "Voir sur LoueTonMatos",
    ctaUrl: cta,
  });
}

export function bookingRequestEmail(
  listerName: string,
  renterName: string,
  listingTitle: string,
  startDate: string,
  endDate: string,
  totalEuros: string
) {
  return renderMarketplaceEmail({
    subject: `Nouvelle demande — ${listingTitle}`,
    preheader: `${renterName} souhaite louer votre matériel`,
    eyebrow: "Location",
    title: "Nouvelle demande de location",
    recipientName: listerName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;"><strong>${escapeHtml(renterName)}</strong> souhaite louer votre matériel :</p>
      ${emailDetailsTable([
        { label: "Annonce", value: listingTitle },
        { label: "Du", value: startDate },
        { label: "Au", value: endDate },
        { label: "Total locataire", value: `${totalEuros} €` },
      ])}
      <p style="margin:0;font-size:14px;color:#6b7280;">La demande expire si vous ne répondez pas sous 48 h.</p>
    `,
    ctaLabel: "Approuver ou refuser",
    ctaUrl: appUrl("/dashboard/bookings?role=lister"),
  });
}

export function bookingApprovedEmail(
  renterName: string,
  listingTitle: string,
  startDate: string,
  endDate: string,
  totalEuros: string
) {
  return renderMarketplaceEmail({
    subject: `Demande approuvée — ${listingTitle}`,
    preheader: "Procédez au paiement pour confirmer",
    eyebrow: "Location",
    title: "Votre demande a été approuvée",
    recipientName: renterName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Le loueur a accepté votre demande pour <strong>${escapeHtml(listingTitle)}</strong>.</p>
      ${emailDetailsTable([
        { label: "Dates", value: `${startDate} → ${endDate}` },
        { label: "Montant à payer", value: `${totalEuros} €` },
      ])}
      <p style="margin:0;font-size:14px;color:#6b7280;">La réservation ne sera effective qu'après paiement.</p>
    `,
    ctaLabel: "Procéder au paiement",
    ctaUrl: appUrl("/dashboard/bookings"),
  });
}

export function bookingConfirmedRenterEmail(
  renterName: string,
  listingTitle: string,
  startDate: string,
  endDate: string,
  listerName: string
) {
  return renderMarketplaceEmail({
    subject: `Réservation confirmée — ${listingTitle}`,
    preheader: "Votre paiement a bien été reçu",
    eyebrow: "Location",
    title: "Réservation confirmée",
    recipientName: renterName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Votre paiement a bien été reçu. La location est confirmée !</p>
      ${emailDetailsTable([
        { label: "Matériel", value: listingTitle },
        { label: "Dates", value: `${startDate} → ${endDate}` },
        { label: "Loueur", value: listerName },
      ])}
    `,
    ctaLabel: "Voir ma réservation",
    ctaUrl: appUrl("/dashboard/bookings"),
  });
}

export function bookingConfirmedListerEmail(
  listerName: string,
  listingTitle: string,
  startDate: string,
  endDate: string,
  renterName: string,
  netEuros: string
) {
  return renderMarketplaceEmail({
    subject: `Paiement reçu — ${listingTitle}`,
    preheader: "La location de votre matériel est confirmée",
    eyebrow: "Location",
    title: "Paiement reçu — location confirmée",
    recipientName: listerName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Le paiement de <strong>${escapeHtml(renterName)}</strong> a été encaissé. La location de votre matériel est confirmée.</p>
      ${emailDetailsTable([
        { label: "Matériel", value: listingTitle },
        { label: "Dates", value: `${startDate} → ${endDate}` },
        { label: "Votre revenu net", value: `${netEuros} €` },
      ])}
    `,
    ctaLabel: "Voir mes locations",
    ctaUrl: appUrl("/dashboard/bookings?role=lister"),
  });
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
  return renderMarketplaceEmail({
    subject: `Réservation annulée — ${listingTitle}`,
    preheader: "Une réservation a été annulée",
    eyebrow: "Location",
    title: "Réservation annulée",
    recipientName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">${who} a annulé la réservation suivante :</p>
      ${emailDetailsTable([
        { label: "Matériel", value: listingTitle },
        { label: "Dates", value: `${startDate} → ${endDate}` },
        { label: "Remboursement", value: refundLabel },
      ])}
    `,
    ctaLabel: "Mes réservations",
    ctaUrl: appUrl("/dashboard/bookings"),
  });
}

export function testEmail(recipientName: string | null) {
  return renderMarketplaceEmail({
    subject: "Test d'envoi LoueTonMatos",
    preheader: "La configuration email fonctionne",
    eyebrow: "Test",
    title: "Test d'envoi réussi",
    recipientName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Si vous lisez ce message, la configuration <strong>Resend</strong> et le template LoueTonMatos fonctionnent correctement.</p>
      <p style="margin:0;">Les notifications (devis, réservations, messages, etc.) pourront vous être envoyées par email.</p>
    `,
    ctaLabel: "Retour au tableau de bord",
    ctaUrl: appUrl("/dashboard"),
  });
}

export function emailVerificationEmail(
  name: string | null,
  token: string,
  email: string,
  invite?: string | null
) {
  const params = new URLSearchParams({ token, email });
  if (invite) params.set("invite", invite);
  const link = appUrl(`/verify-email?${params.toString()}`);

  return renderMarketplaceEmail({
    subject: "Confirmez votre adresse email",
    preheader: "Activez votre compte LoueTonMatos",
    eyebrow: "Inscription",
    title: "Confirmez votre adresse email",
    recipientName: name,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Merci de rejoindre LoueTonMatos. Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
      <p style="margin:0;font-size:14px;color:#6b7280;">Ce lien expire dans <strong>24 heures</strong>.</p>
    `,
    ctaLabel: "Vérifier mon email",
    ctaUrl: link,
  });
}

export function urgentForumEmail(
  recipientName: string | null,
  authorName: string,
  postTitle: string,
  when: string,
  postId: string
) {
  return renderMarketplaceEmail({
    subject: `[Urgent] ${postTitle}`,
    preheader: `Besoin pour ${when}`,
    eyebrow: "Actu",
    title: "Besoin urgent sur LoueTonMatos",
    recipientName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;"><strong>${escapeHtml(authorName)}</strong> a publié un besoin pour <strong>${escapeHtml(when)}</strong> :</p>
      <p style="margin:0;"><em>${escapeHtml(postTitle)}</em></p>
    `,
    ctaLabel: "Voir sur le fil Actu",
    ctaUrl: appUrl(`/forum/${postId}`),
  });
}

export function reviewReminderEmail(
  recipientName: string | null,
  listingTitle: string,
  roleLabel: string
) {
  return renderMarketplaceEmail({
    subject: `Rappel — laissez un avis sur ${listingTitle}`,
    preheader: "Votre avis aide la communauté",
    eyebrow: "Avis",
    title: "Votre avis compte",
    recipientName,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">Votre location « <strong>${escapeHtml(listingTitle)}</strong> » est terminée depuis quelques jours.</p>
      <p style="margin:0;">En tant que ${escapeHtml(roleLabel)}, votre avis aide la communauté LoueTonMatos.</p>
    `,
    ctaLabel: "Laisser un avis",
    ctaUrl: appUrl("/dashboard/bookings"),
  });
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
      html: renderMarketplaceEmail({
        subject: `Votre facture — ${booking.listingTitle}`,
        preheader: `Facture N° ${number} en pièce jointe`,
        eyebrow: "Facture",
        title: "Votre facture est disponible",
        recipientName: renter.name,
        bodyHtml: `
          <p style="margin:0 0 12px 0;">La location de <strong>${escapeHtml(booking.listingTitle)}</strong>
             du ${escapeHtml(startStr)} au ${escapeHtml(endStr)} est confirmée.</p>
          <p style="margin:0;">Retrouvez votre facture (N° ${escapeHtml(number)}) en pièce jointe.
             <strong>Total réglé : ${escapeHtml(totalStr)} €</strong>.</p>
        `,
        ctaLabel: "Voir ma réservation",
        ctaUrl: appUrl("/dashboard/bookings"),
      }),
      attachments: [attachment],
    });
  }

  if (isDeliverableEmail(lister.email)) {
    await sendEmail({
      to: lister.email,
      subject: `Paiement reçu — ${booking.listingTitle}`,
      html: renderMarketplaceEmail({
        subject: `Paiement reçu — ${booking.listingTitle}`,
        preheader: `Revenu net ${netStr} €`,
        eyebrow: "Paiement",
        title: "Paiement reçu",
        recipientName: lister.name,
        bodyHtml: `
          <p style="margin:0 0 12px 0;">Le paiement pour <strong>${escapeHtml(booking.listingTitle)}</strong>
             (${escapeHtml(startStr)} → ${escapeHtml(endStr)}) a bien été encaissé.</p>
          <p style="margin:0 0 12px 0;">Votre revenu net : <strong>${escapeHtml(netStr)} €</strong>
             (versé à la clôture de la location).</p>
          <p style="margin:0;">La facture locataire (N° ${escapeHtml(number)}) est en pièce jointe pour vos archives.</p>
        `,
        ctaLabel: "Voir mes locations",
        ctaUrl: appUrl("/dashboard/bookings?role=lister"),
      }),
      attachments: [attachment],
    });
  }
}
