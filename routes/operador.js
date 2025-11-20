import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// LOGIN DO MOTORISTA
router.post("/login", async (req, res) => {
  const { cpf7 } = req.body;

  try {
    const result = await pool.query(
      `SELECT DISTINCT chave_fun, matricula, nome, sete_digitos_cpf, periodo, media_pontos, desempenho, ranking
       FROM vw_operador_movimento
       WHERE sete_digitos_cpf = $1`,
      [cpf7]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ erro: "Motorista não encontrado" });

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro na API" });
  }
});

// MOVIMENTOS
router.get("/movimentos/:cpf7", async (req, res) => {
  const { cpf7 } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
       FROM vw_operador_movimento
       WHERE sete_digitos_cpf = $1
       ORDER BY data_movimento DESC`,
      [cpf7]
    );

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro na API" });
  }
});

export default router;
