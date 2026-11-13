import "dotenv/config";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import { exigirAutenticacao } from "./autenticacao.js";
import { iniciarAgendador } from "./avisos.js";
import { pool } from "./banco.js";
import rotasAutenticacao from "./rotas/autenticacao.js";
import rotasAtividades from "./rotas/atividades.js";
import rotasMaterias from "./rotas/materias.js";
import rotasConteudos from "./rotas/conteudos.js";
import rotasNotificacoes from "./rotas/notificacoes.js";

const app = express();

app.use(cors({ origin: (process.env.FRONT_URL || "http://localhost:5173").split(",") }));
app.use(express.json());

app.get("/api/saude", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", rotasAutenticacao);
app.use("/api/atividades", exigirAutenticacao, rotasAtividades);
app.use("/api/materias", exigirAutenticacao, rotasMaterias);
app.use("/api/conteudos", exigirAutenticacao, rotasConteudos);
app.use("/api/notificacoes", exigirAutenticacao, rotasNotificacoes);

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada" }));

app.use((erro, _req, res, _next) => {
  console.error(erro);
  if (erro.code === "22P02") return res.status(400).json({ erro: "Dado inválido" });
  res.status(500).json({ erro: "Algo deu errado aqui do nosso lado" });
});

// Atualiza as tabelas ao ligar (só cria o que falta, não apaga nada).
// Assim não é preciso rodar o migrate à mão depois de cada mudança no banco.
try {
  const sql = fs.readFileSync(new URL("../sql/schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
  console.log("Banco atualizado");
} catch (erro) {
  console.error("Não consegui atualizar o banco:", erro.message);
}

const porta = process.env.PORT || 3333;
app.listen(porta, () => {
  console.log(`API rodando na porta ${porta}`);
  iniciarAgendador();
});
