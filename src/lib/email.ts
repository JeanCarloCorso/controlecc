import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mailpit",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  disableFileAccess: true,
  disableUrlAccess: true,
});

type AccountEmailKind = "verify_email" | "reset_password";

const contentByKind = {
  verify_email: {
    subject: "Confirme seu e-mail | Controle CC",
    preheader: "Confirme seu cadastro para acessar o Controle CC.",
    title: "Confirme seu e-mail",
    introduction: "Seu cadastro no Controle CC foi recebido.",
    explanation: "Para concluir a criação da conta e acessar o sistema de atividades complementares, precisamos confirmar que este endereço de e-mail pertence a você.",
    action: "Confirmar e-mail",
    expiration: "Este link é válido por 24 horas e pode ser utilizado apenas uma vez.",
  },
  reset_password: {
    subject: "Redefinição de senha | Controle CC",
    preheader: "Use este link para criar uma nova senha no Controle CC.",
    title: "Redefina sua senha",
    introduction: "Recebemos uma solicitação para alterar a senha da sua conta.",
    explanation: "Clique no botão abaixo para criar uma nova senha. Depois da alteração, use a nova senha para entrar no Controle CC.",
    action: "Criar nova senha",
    expiration: "Este link é válido por 1 hora e pode ser utilizado apenas uma vez.",
  },
} satisfies Record<AccountEmailKind, Record<string, string>>;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

export async function sendAccountEmail(to: string, kind: AccountEmailKind, path: string, recipientName?: string) {
  const baseUrl = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const actionUrl = `${baseUrl}${path}`;
  const content = contentByKind[kind];
  const greeting = recipientName?.trim() ? `Olá, ${recipientName.trim()}.` : "Olá.";
  const safeUrl = escapeHtml(actionUrl);

  const text = `${greeting}

${content.introduction}

${content.explanation}

${content.action}: ${actionUrl}

${content.expiration}

Se você não solicitou esta ação, ignore este e-mail. Nenhuma alteração será realizada.

Controle CC
Ciência da Computação — Instituto Federal Catarinense
Esta é uma mensagem automática. Não responda a este e-mail.`;

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(content.subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f3f3;color:#333;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f3f3;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#fff;border:1px solid #ccc;">
<tr><td style="height:6px;background:#1351b4;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:24px 32px;border-bottom:1px solid #e6e6e6;"><table role="presentation" width="100%"><tr><td><div style="font-size:22px;font-weight:700;color:#071d41;">Controle CC</div><div style="margin-top:4px;font-size:13px;color:#555;">Ciência da Computação</div></td><td align="right" style="font-size:12px;font-weight:700;letter-spacing:.06em;color:#1351b4;">SERVIÇO ACADÊMICO</td></tr></table></td></tr>
<tr><td style="padding:32px;">
<p style="margin:0 0 20px;font-size:16px;line-height:1.5;">${escapeHtml(greeting)}</p>
<h1 style="margin:0 0 16px;font-size:30px;line-height:1.2;font-weight:600;color:#333;">${escapeHtml(content.title)}</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;">${escapeHtml(content.introduction)}</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#555;">${escapeHtml(content.explanation)}</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#1351b4" style="border-radius:999px;"><a href="${safeUrl}" style="display:inline-block;padding:13px 24px;color:#fff;text-decoration:none;font-size:16px;font-weight:700;">${escapeHtml(content.action)}</a></td></tr></table>
<div style="margin-top:28px;padding:16px;border-left:4px solid #155bcb;background:#edf5ff;"><p style="margin:0;font-size:14px;line-height:1.5;"><strong>Prazo de utilização:</strong> ${escapeHtml(content.expiration)}</p></div>
<p style="margin:24px 0 8px;font-size:14px;line-height:1.5;color:#555;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
<p style="margin:0;padding:12px;background:#f8f8f8;border:1px solid #e6e6e6;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${safeUrl}" style="color:#1351b4;">${safeUrl}</a></p>
<p style="margin:24px 0 0;font-size:14px;line-height:1.5;color:#555;"><strong>Não reconhece esta solicitação?</strong><br>Ignore esta mensagem. Nenhuma alteração será realizada sem a confirmação pelo link.</p>
</td></tr>
<tr><td style="padding:22px 32px;background:#071d41;color:#fff;"><div style="font-size:14px;font-weight:700;">Controle CC</div><div style="margin-top:5px;font-size:12px;line-height:1.5;color:#c5d4eb;">Instituto Federal Catarinense<br>Esta é uma mensagem automática. Não responda a este e-mail.</div></td></tr>
</table></td></tr></table></body></html>`;

  await transporter.sendMail({ from: process.env.SMTP_FROM || "Controle CC <no-reply@localhost>", to, subject: content.subject, text, html });
}
