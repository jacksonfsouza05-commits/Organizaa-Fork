import "dotenv/config";
import { consultar } from "./banco.js";
import { enviarEmail, emailConfigurado } from "./email.js";
import { montarEmailPrazos } from "./modelosEmail.js";

// A partir de que hora (horário de Brasília) o aviso diário pode sair. Padrão: 8h.
const horaConfigurada = Number(process.env.HORA_DO_AVISO ?? 8);
const HORA_DO_AVISO = Number.isInteger(horaConfigurada) && horaConfigurada >= 0 && horaConfigurada <= 23 ? horaConfigurada : 8;
const INTERVALO_MS = 15 * 60 * 1000;

const HOJE = "(now() at time zone 'America/Sao_Paulo')::date";

// Atividades não concluídas que estão dentro da antecedência escolhida pelo estudante
// (inclui as atrasadas, igual ao sininho do site).
export async function buscarAtividadesProximas(estudanteId, limite = 20) {
  const { rows } = await consultar(
    `select a.id, a.nome, m.nome as materia, a.prazo, a.prazo - ${HOJE} as dias
     from atividades a
     join materias m on m.id = a.materia_id
     join estudantes e on e.id = a.estudante_id
     where a.estudante_id = $1 and not a.concluida
       and a.prazo - ${HOJE} <= e.antecedencia_dias
     order by a.prazo, a.id
     limit $2`,
    [estudanteId, limite]
  );
  return rows;
}

// Usado pelo botão "Enviar e-mail de teste" das Configurações.
export async function enviarEmailDeTeste(estudante) {
  const atividades = await buscarAtividadesProximas(estudante.id);
  await enviarEmail({ para: estudante.email, ...montarEmailPrazos(estudante.nome, atividades, { teste: true }) });
}

let rodando = false;

// Envia no máximo 1 e-mail por estudante por dia. Se o servidor reiniciar ou dormir,
// o aviso sai assim que ele voltar (desde que já passou da hora do aviso).
export async function verificarEnvios() {
  if (!emailConfigurado || rodando) return;
  rodando = true;
  try {
    const { rows: [agora] } = await consultar(
      `select ${HOJE} as hoje, extract(hour from now() at time zone 'America/Sao_Paulo')::int as hora`
    );
    if (agora.hora < HORA_DO_AVISO) return;

    const { rows: estudantes } = await consultar(
      `select id, nome, email, ultimo_aviso_email as anterior
       from estudantes
       where notif_email and (ultimo_aviso_email is null or ultimo_aviso_email < $1::date)`,
      [agora.hoje]
    );

    for (const estudante of estudantes) {
      try {
        const atividades = await buscarAtividadesProximas(estudante.id);
        if (!atividades.length) continue;

        // "reserva" o dia antes de enviar, para duas instâncias do servidor não mandarem o mesmo e-mail
        const reserva = await consultar(
          `update estudantes set ultimo_aviso_email = $1::date
           where id = $2 and notif_email and (ultimo_aviso_email is null or ultimo_aviso_email < $1::date)`,
          [agora.hoje, estudante.id]
        );
        if (!reserva.rowCount) continue;

        try {
          await enviarEmail({ para: estudante.email, ...montarEmailPrazos(estudante.nome, atividades) });
          console.log(`Aviso de prazo enviado para ${estudante.email} (${atividades.length} atividade(s))`);
        } catch (falha) {
          // não deu pra enviar: devolve o dia para tentar de novo no próximo ciclo
          await consultar(
            "update estudantes set ultimo_aviso_email = $1::date where id = $2 and ultimo_aviso_email = $3::date",
            [estudante.anterior, estudante.id, agora.hoje]
          );
          throw falha;
        }
      } catch (falha) {
        console.error(`Falha ao enviar aviso para ${estudante.email}:`, falha.message);
      }
    }
  } finally {
    rodando = false;
  }
}

export function iniciarAgendador() {
  if (!emailConfigurado) {
    console.log("Avisos por e-mail desligados: preencha GMAIL_USUARIO e GMAIL_SENHA_APP no .env para ligar.");
    return;
  }
  console.log(`Avisos por e-mail ligados (a partir das ${HORA_DO_AVISO}h, horário de Brasília)`);

  const rodar = () => verificarEnvios().catch((falha) => console.error("Erro ao verificar avisos por e-mail:", falha.message));
  setTimeout(rodar, 10_000);
  setInterval(rodar, INTERVALO_MS);
}
