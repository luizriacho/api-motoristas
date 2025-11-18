import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new pg.Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD
});

// TESTE DE CONEXÃO — ESSENCIAL
pool.connect()
  .then(() => console.log("✔ Conectado ao PostgreSQL com sucesso"))
  .catch(err => console.error("❌ ERRO ao conectar no PostgreSQL:", err));
