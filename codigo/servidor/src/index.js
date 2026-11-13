import "dotenv/config";
import express from "express";
import cors from "cors";
import { exigirAutenticacao } from "./autenticacao.js";
import { iniciarAgendador } from "./avisos.js";
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

const porta = process.env.PORT || 3333;
app.listen(porta, () => {
  console.log(`API rodando na porta ${porta}`);
  iniciarAgendador();
});
