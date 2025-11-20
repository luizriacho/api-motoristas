import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= TESTE BANCO =================
pool.connect()
  .then(() => console.log("✔ Banco conectado com sucesso"))
  .catch(err => console.error("❌ Erro banco:", err));

// ================= ROTAS =================

// Raiz
app.get("/", (req, res) => {
  res.send("API ONLINE 🚀");
});

// Teste simples da API
app.get("/api", (req, res) => {
  res.json({ status: "API funcionando perfeitamente ✅" });
});

// LOGIN DIRETO (teste)
app.post("/api/login", async (req, res) => {
  const { cpf7 } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM vw_operador_movimento WHERE sete_digitos_cpf = $1`,
      [cpf7]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Motorista não encontrado" });
    }

    res.json(result.rows[0]);

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro interno na API" });
  }
});

// ================= SERVIDOR =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
