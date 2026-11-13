import { Router } from "express";
import { consultar } from "../banco.js";
import { buscarAtividadesProximas, enviarEmailDeTeste } from "../avisos.js";
import { emailConfigurado } from "../email.js";
import { criarLimitador } from "../limitador.js";
import { descreverPrazo } from "../modelosEmail.js";

const router = Router();

const limitarTeste = criarLimitador(30_000);

router.get("/", async (req, res) => {
  const { rows: [estudante] } = await consultar("select notif_prazo from estudantes where id = $1", [req.estudanteId]);
  if (!estudante?.notif_prazo) return res.json([]);

  const atividades = await buscarAtividadesProximas(req.estudanteId);
  res.json(atividades.map((a) => ({
    id: a.id,
    texto: `${a.nome} (${a.materia}) ${descreverPrazo(a.dias)}`,
    urgente: a.dias <= 1,
  })));
});

router.post("/email-teste", async (req, res) => {
  if (!emailConfigurado) {
    return res.status(503).json({ erro: "O servidor ainda não está configurado para enviar e-mails" });
  }
  if (!limitarTeste(req.estudanteId)) {
    return res.status(429).json({ erro: "Espere uns segundos antes de pedir outro e-mail de teste" });
  }

  const { rows: [estudante] } = await consultar("select id, nome, email from estudantes where id = $1", [req.estudanteId]);
  if (!estudante) return res.status(404).json({ erro: "Conta não encontrada" });

  try {
    await enviarEmailDeTeste(estudante);
    res.json({ ok: true });
  } catch (falha) {
    console.error("Falha ao enviar e-mail de teste:", falha.message);
    res.status(502).json({ erro: "Não consegui enviar o e-mail. Confira o usuário e a senha de app do Gmail no servidor" });
  }
});

export default router;
