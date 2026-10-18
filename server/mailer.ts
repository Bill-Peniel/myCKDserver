import nodemailer from "nodemailer";
import { escapeHtml } from "./utils";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Envoi best-effort : une erreur d'email ne doit jamais faire échouer la requête
export async function sendEmail(to: string | null | undefined, subject: string, html: string): Promise<boolean> {
  if (!to) return false;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email non envoyé : EMAIL_USER / EMAIL_PASS non configurés");
    return false;
  }
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
    return true;
  } catch (error) {
    console.error("Échec de l'envoi de l'email:", error);
    return false;
  }
}

export function emailLayout(title: string, body: string, footer = "Ce message a été envoyé automatiquement par le Système de Suivi MRC."): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2563eb;">${title}</h1>
        <hr style="border: 1px solid #eee;">
      </div>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px; color: #374151; line-height: 1.6;">
        ${body}
      </div>
      <div style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px;">
        <p>${footer}</p>
      </div>
    </div>
  `;
}

// E-mail envoyé au médecin à la création de son compte (ou au renvoi des identifiants)
export function sendDoctorCredentials(params: {
  to: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
  loginUrl: string;
  isReset?: boolean;
}) {
  const { to, firstName, lastName, temporaryPassword, loginUrl, isReset } = params;
  const subject = isReset ? "Vos nouveaux identifiants CKD Care" : "Votre compte CKD Care a été créé";
  const intro = isReset
    ? "Un administrateur a réinitialisé votre mot de passe. Voici vos nouveaux identifiants :"
    : "Un administrateur vient de créer votre compte médecin sur CKD Care. Voici vos identifiants de connexion :";

  return sendEmail(
    to,
    subject,
    emailLayout(
      "CKD Care",
      `<p>Bonjour Dr. ${escapeHtml(firstName)} ${escapeHtml(lastName)},</p>
       <p>${intro}</p>
       <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px; margin:16px 0;">
         <p style="margin:4px 0;"><strong>Identifiant :</strong> ${escapeHtml(to)}</p>
         <p style="margin:4px 0;"><strong>Mot de passe temporaire :</strong> <code style="font-size:15px;">${escapeHtml(temporaryPassword)}</code></p>
       </div>
       <p style="text-align:center; margin:24px 0;">
         <a href="${escapeHtml(loginUrl)}" style="background:#0f766e; color:#ffffff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">Se connecter</a>
       </p>
       <p>Pour votre sécurité, changez ce mot de passe dès votre première connexion dans <strong>Paramètres → Sécurité</strong>.</p>`,
      "Si vous n'êtes pas à l'origine de cette demande, contactez l'administrateur de la plateforme.",
    ),
  );
}
