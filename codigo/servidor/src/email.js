import "dotenv/config";
import nodemailer from "nodemailer";

// Conta do Gmail que envia os e-mails.
// Precisa de "senha de app" (Conta Google > Segurança > Verificação em duas etapas > Senhas de app).
// A senha normal do Gmail NÃO funciona aqui.
const usuario = (process.env.GMAIL_USUARIO || "").trim();
const senhaApp = (process.env.GMAIL_SENHA_APP || "").replace(/\s+/g, "");
const nomeRemetente = process.env.EMAIL_NOME_REMETENTE || "OrganizaAI";

export const emailConfigurado = Boolean(usuario && senhaApp);

const transporte = emailConfigurado
  ? nodemailer.createTransport({ service: "gmail", auth: { user: usuario, pass: senhaApp } })
  : null;

export async function enviarEmail({ para, assunto, texto, html }) {
  if (!transporte) throw new Error("E-mail não configurado: faltam GMAIL_USUARIO e GMAIL_SENHA_APP no .env");
  await transporte.sendMail({
    from: `"${nomeRemetente}" <${usuario}>`,
    to: para,
    subject: assunto,
    text: texto,
    html,
  });
}
