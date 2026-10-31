import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mailpit",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
});

export async function sendAccountEmail(to: string, subject: string, path: string) {
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "ControleCC <no-reply@localhost>",
    to,
    subject,
    text: `${subject}: ${baseUrl}${path}`,
    html: `<p>${subject}</p><p><a href="${baseUrl}${path}">Continuar</a></p>`,
  });
}
