import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// LOGIN DO MOTORISTA (8 dígitos)
router.post("/login", async (req, res) => {
  const { digitos } = req.body;

  try {
    const result = await pool.query(
      `SELECT DISTINCT 
          chave_fun, matricula, nome, digitos, periodo, 
          media_pontos, desempenho, ranking, empresa, numero_linha
       FROM vw_operador_movimento
       WHERE digitos = $1`,
      [digitos]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ erro: "Motorista não encontrado" });

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro na API" });
  }
});

// MOVIMENTOS (8 dígitos)
router.get("/movimentos/:digitos", async (req, res) => {
  const { digitos } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
       FROM vw_operador_movimento
       WHERE digitos = $1
       ORDER BY data_movimento DESC`,
      [digitos]
    );

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro na API" });
  }
});

export default router;
