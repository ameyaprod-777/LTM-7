import { Resend } from "resend";

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

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
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
