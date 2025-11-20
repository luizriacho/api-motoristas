import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import operadorRoutes from "./routes/operador.js";
import { pool } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================
// TESTE DE CONEXÃO COM BANCO
// ============================
pool.connect()
  .then(() => console.log("✔ Conectado ao PostgreSQL com sucesso"))
  .catch(err => console.error("❌ Erro ao conectar no PostgreSQL:", err));

// ============================
// ROTAS
// ============================

// Rota principal
app.get("/", (req, res) => {
  res.send("API está rodando corretamente 🚀");
});

// Rota de verificação da API
app.get("/api", (req, res) => {
  res.json({ status: "API online e funcional ✅" });
});

// Rotas do sistema (login, movimentos etc)
app.use("/api", operadorRoutes);

// ============================
// SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ API rodando na porta ${PORT}`);
});
