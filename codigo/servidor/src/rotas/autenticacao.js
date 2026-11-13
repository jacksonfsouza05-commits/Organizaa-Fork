import crypto from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { consultar } from "../banco.js";
import { gerarToken, exigirAutenticacao } from "../autenticacao.js";
import { enviarEmail, emailConfigurado } from "../email.js";
import { LINK_DO_APP, montarEmailRedefinicao } from "../modelosEmail.js";
import { criarLimitador } from "../limitador.js";

const router = Router();

const limitarRecuperacao = criarLimitador(60_000);
const gerarHashDoToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const publico = (e) => ({
  id: e.id,
  nome: e.nome,
  email: e.email,
  notifPrazo: e.notif_prazo,
  notifEmail: e.notif_email,
  notifDiario: e.notif_diario,
  notifSemanal: e.notif_semanal,
  antecedencia: e.antecedencia_dias,
  senhaAlteradaEm: e.senha_alterada_em,
});

router.post("/registrar", async (req, res) => {
  const nome = (req.body.nome || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();
  const senha = req.body.senha || "";

  if (!nome || !email || !senha) return res.status(400).json({ erro: "Preencha nome, e-mail e senha" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ erro: "E-mail inválido" });
  if (senha.length < 8) return res.status(400).json({ erro: "A senha precisa ter pelo menos 8 caracteres" });

  const existe = await consultar("select 1 from estudantes where email = $1", [email]);
  if (existe.rowCount) return res.status(409).json({ erro: "Esse e-mail já tem conta" });

  const senhaHash = await bcrypt.hash(senha, 10);
  const { rows } = await consultar(
    "insert into estudantes (nome, email, senha_hash) values ($1, $2, $3) returning *",
    [nome, email, senhaHash]
  );
  res.status(201).json({ token: gerarToken(rows[0].id), estudante: publico(rows[0]) });
});

router.post("/entrar", async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const senha = req.body.senha || "";

  const { rows } = await consultar("select * from estudantes where email = $1", [email]);
  const e = rows[0];
  if (!e || !(await bcrypt.compare(senha, e.senha_hash))) {
    return res.status(401).json({ erro: "E-mail ou senha incorretos" });
  }
  res.json({ token: gerarToken(e.id), estudante: publico(e) });
});

router.get("/eu", exigirAutenticacao, async (req, res) => {
  const { rows } = await consultar("select * from estudantes where id = $1", [req.estudanteId]);
  if (!rows[0]) return res.status(401).json({ erro: "Conta não encontrada" });
  res.json(publico(rows[0]));
});

router.put("/eu", exigirAutenticacao, async (req, res) => {
  const { nome, notifPrazo, notifEmail, notifDiario, notifSemanal, antecedencia } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ erro: "O nome não pode ficar vazio" });
  const dias = Number(antecedencia);
  if (!Number.isInteger(dias) || dias < 1 || dias > 30) {
    return res.status(400).json({ erro: "Antecedência deve ser entre 1 e 30 dias" });
  }

  const { rows } = await consultar(
    `update estudantes set nome = $1, notif_prazo = $2, notif_diario = $3,
       notif_semanal = $4, antecedencia_dias = $5, notif_email = coalesce($7, notif_email)
     where id = $6 returning *`,
    [nome.trim(), !!notifPrazo, !!notifDiario, !!notifSemanal, dias, req.estudanteId,
      typeof notifEmail === "boolean" ? notifEmail : null]
  );
  res.json(publico(rows[0]));
});

router.put("/senha", exigirAutenticacao, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!novaSenha || novaSenha.length < 8) {
    return res.status(400).json({ erro: "A nova senha precisa ter pelo menos 8 caracteres" });
  }
  const { rows } = await consultar("select senha_hash from estudantes where id = $1", [req.estudanteId]);
  if (!rows[0] || !(await bcrypt.compare(senhaAtual || "", rows[0].senha_hash))) {
    return res.status(401).json({ erro: "Senha atual incorreta" });
  }
  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await consultar("update estudantes set senha_hash = $1, senha_alterada_em = now() where id = $2", [senhaHash, req.estudanteId]);
  res.json({ ok: true });
});

// Passo 1 da recuperação: o estudante informa o e-mail e recebe um link (válido por 1 hora).
router.post("/esqueci-senha", async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ erro: "E-mail inválido" });

  // A resposta é sempre a mesma, tenha conta ou não, para ninguém descobrir quem está cadastrado.
  res.json({ ok: true });

  if (!limitarRecuperacao(email)) return;
  try {
    const { rows } = await consultar("select id, nome from estudantes where email = $1", [email]);
    const estudante = rows[0];
    if (!estudante) return;

    const token = crypto.randomBytes(32).toString("hex");
    await consultar("delete from redefinicoes_senha where estudante_id = $1 or expira_em < now()", [estudante.id]);
    await consultar(
      "insert into redefinicoes_senha (estudante_id, token_hash, expira_em) values ($1, $2, now() + interval '1 hour')",
      [estudante.id, gerarHashDoToken(token)]
    );

    const link = new URL(LINK_DO_APP);
    link.searchParams.set("redefinir", token);

    if (!emailConfigurado) {
      if (process.env.NODE_ENV !== "production") console.log(`[sem Gmail configurado] Link de recuperação de ${email}: ${link}`);
      else console.error("Recuperação de senha pedida, mas faltam GMAIL_USUARIO e GMAIL_SENHA_APP no servidor");
      return;
    }
    await enviarEmail({ para: email, ...montarEmailRedefinicao(estudante.nome, link.toString()) });
  } catch (falha) {
    console.error("Falha ao enviar e-mail de recuperação de senha:", falha.message);
  }
});

// Passo 2: o estudante abre o link do e-mail e define a nova senha.
router.post("/redefinir-senha", async (req, res) => {
  const token = String(req.body.token || "");
  const novaSenha = req.body.novaSenha || "";

  if (novaSenha.length < 8) return res.status(400).json({ erro: "A nova senha precisa ter pelo menos 8 caracteres" });
  if (!/^[0-9a-f]{64}$/.test(token)) return res.status(400).json({ erro: "Link inválido ou expirado. Peça um novo" });

  // apagar + devolver numa consulta só garante que o link vale uma única vez
  const { rows } = await consultar(
    "delete from redefinicoes_senha where token_hash = $1 and expira_em > now() returning estudante_id",
    [gerarHashDoToken(token)]
  );
  if (!rows[0]) return res.status(400).json({ erro: "Link inválido ou expirado. Peça um novo" });

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await consultar("update estudantes set senha_hash = $1, senha_alterada_em = now() where id = $2", [senhaHash, rows[0].estudante_id]);
  await consultar("delete from redefinicoes_senha where estudante_id = $1", [rows[0].estudante_id]);
  res.json({ ok: true });
});

export default router;
