import "dotenv/config";

// Endereço do site (o link que vai dentro dos e-mails).
// Ex.: https://seuusuario.github.io/Organizaa-Fork/
export const LINK_DO_APP = (process.env.LINK_DO_APP || (process.env.FRONT_URL || "http://localhost:5173").split(",")[0]).trim();

export const escaparHtml = (valor) =>
  String(valor).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const formatarData = (iso) => {
  const [ano, mes, dia] = String(iso).slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
};

export function descreverPrazo(dias) {
  if (dias < 0) return `atrasada há ${-dias} dia${dias === -1 ? "" : "s"}`;
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `vence em ${dias} dias`;
}

const COR = "#7C3AED";

function moldura(titulo, corpoHtml) {
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#F5F3FF;font-family:Arial,Helvetica,sans-serif;color:#1E1B2E;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #DDD6FE;border-radius:12px;overflow:hidden;">
    <div style="background:${COR};padding:18px 24px;color:#ffffff;font-size:20px;font-weight:bold;">OrganizaAI</div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 12px;font-size:20px;">${escaparHtml(titulo)}</h2>
      ${corpoHtml}
    </div>
  </div>
</body>
</html>`;
}

const botao = (link, rotulo) =>
  `<p style="margin:24px 0 0;"><a href="${escaparHtml(link)}" style="display:inline-block;background:${COR};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;font-size:14px;">${escaparHtml(rotulo)}</a></p>`;

// atividades: [{ nome, materia, prazo, dias }]
export function montarEmailPrazos(nomeEstudante, atividades, { teste = false } = {}) {
  const primeiroNome = (nomeEstudante || "").split(" ")[0] || "estudante";
  const n = atividades.length;

  const assunto = n
    ? `${teste ? "[Teste] " : ""}Você tem ${n} atividade${n > 1 ? "s" : ""} perto do prazo`
    : "[Teste] E-mail de avisos do OrganizaAI";

  const linhasTexto = atividades.map((a) => `- ${a.nome} (${a.materia}): ${descreverPrazo(a.dias)} - ${formatarData(a.prazo)}`);
  const texto = [
    `Olá, ${primeiroNome}!`,
    "",
    n ? "Essas atividades estão perto do prazo:" : "Você não tem nenhuma atividade perto do prazo agora.",
    ...linhasTexto,
    "",
    ...(teste ? ["Este é um e-mail de teste: os avisos de verdade chegam assim.", ""] : []),
    `Abra o OrganizaAI: ${LINK_DO_APP}`,
    "",
    "Para parar de receber, desative os alertas por e-mail em Configurações > Notificações.",
  ].join("\n");

  const itens = atividades.map((a) => {
    const urgente = a.dias <= 1;
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #F0EDF9;">
        <div style="font-weight:bold;font-size:14px;">${escaparHtml(a.nome)}</div>
        <div style="font-size:12px;color:#6B7280;">${escaparHtml(a.materia)}</div>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #F0EDF9;text-align:right;white-space:nowrap;">
        <div style="font-size:13px;font-weight:bold;color:${urgente ? "#DC2626" : "#D97706"};">${escaparHtml(descreverPrazo(a.dias))}</div>
        <div style="font-size:12px;color:#6B7280;">${formatarData(a.prazo)}</div>
      </td>
    </tr>`;
  }).join("");

  const corpo = `
    <p style="margin:0 0 16px;font-size:14px;">Olá, ${escaparHtml(primeiroNome)}!</p>
    ${n
      ? `<p style="margin:0 0 8px;font-size:14px;">Essas atividades estão perto do prazo:</p>
         <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itens}</table>`
      : `<p style="margin:0;font-size:14px;">Você não tem nenhuma atividade perto do prazo agora 🎉</p>`}
    ${teste ? `<p style="margin:16px 0 0;font-size:12px;color:#6B7280;">Este é um e-mail de teste: os avisos de verdade chegam assim.</p>` : ""}
    ${botao(LINK_DO_APP, "Abrir o OrganizaAI")}
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;">Para parar de receber, desative os alertas por e-mail em Configurações &rarr; Notificações.</p>`;

  return { assunto, texto, html: moldura(n ? "Atividades perto do prazo" : "Tudo certo por aqui", corpo) };
}

export function montarEmailRedefinicao(nomeEstudante, link) {
  const primeiroNome = (nomeEstudante || "").split(" ")[0] || "estudante";

  const texto = [
    `Olá, ${primeiroNome}!`,
    "",
    "Recebemos um pedido para criar uma nova senha na sua conta do OrganizaAI.",
    "Use o link abaixo (ele vale por 1 hora e só pode ser usado uma vez):",
    link,
    "",
    "Se não foi você, é só ignorar este e-mail: a sua senha continua a mesma.",
  ].join("\n");

  const corpo = `
    <p style="margin:0 0 16px;font-size:14px;">Olá, ${escaparHtml(primeiroNome)}!</p>
    <p style="margin:0;font-size:14px;line-height:1.5;">Recebemos um pedido para criar uma nova senha na sua conta do OrganizaAI. O link vale por <b>1 hora</b> e só pode ser usado uma vez.</p>
    ${botao(link, "Criar nova senha")}
    <p style="margin:20px 0 0;font-size:12px;color:#6B7280;word-break:break-all;">Se o botão não funcionar, copie este endereço no navegador:<br>${escaparHtml(link)}</p>
    <p style="margin:20px 0 0;font-size:12px;color:#6B7280;">Se não foi você, é só ignorar este e-mail: a sua senha continua a mesma.</p>`;

  return { assunto: "Recuperação de senha - OrganizaAI", texto, html: moldura("Recuperar senha", corpo) };
}
