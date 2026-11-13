import "dotenv/config";
import jwt from "jsonwebtoken";

const segredo = process.env.JWT_SECRET;
if (!segredo) {
  console.error("Falta o JWT_SECRET no .env");
  process.exit(1);
}

export const gerarToken = (id) => jwt.sign({ id }, segredo, { expiresIn: "7d" });

export function exigirAutenticacao(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : null;
  if (!token) return res.status(401).json({ erro: "Faça login para continuar" });
  try {
    req.estudanteId = jwt.verify(token, segredo).id;
    next();
  } catch {
    res.status(401).json({ erro: "Sessão expirada, entre de novo" });
  }
}
