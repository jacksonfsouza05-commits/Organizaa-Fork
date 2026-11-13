import "dotenv/config";
import fs from "node:fs";
import pg from "pg";

pg.types.setTypeParser(1082, (v) => v);

const url = new URL(process.env.DATABASE_URL || "postgres://localhost/avisai");
const local = ["localhost", "127.0.0.1"].includes(url.hostname);
url.searchParams.delete("sslmode");

let ssl = false;
if (!local) {
  const caminhoCa = process.env.DB_CA_PATH;
  ssl = caminhoCa && fs.existsSync(caminhoCa)
    ? { ca: fs.readFileSync(caminhoCa, "utf8"), rejectUnauthorized: true }
    : { rejectUnauthorized: false };
}

export const pool = new pg.Pool({ connectionString: url.toString(), ssl, max: 10 });

export const consultar = (texto, parametros) => pool.query(texto, parametros);
