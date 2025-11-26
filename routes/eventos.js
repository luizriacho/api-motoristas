import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// LOGIN DO MOTORISTA - COM DIGITOS
router.post("/login", async (req, res) => {
  const { digitos } = req.body;

  try {
    const result = await pool.query(
      `SELECT DISTINCT chave_fun, matricula, nome, digitos, periodo, media_pontos, desempenho, ranking
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

// MOVIMENTOS
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

// EVENTOS - COM DIGITOS
router.get("/eventos", async (req, res) => {
  try {
    const { digitos } = req.query;

    if (!digitos) {
      return res.status(400).json({
        error: 'Parâmetro "digitos" é obrigatório'
      });
    }

    if (digitos.length !== 7 || isNaN(digitos)) {
      return res.status(400).json({
        error: 'digitos deve conter exatamente 7 números'
      });
    }

    const query = `
      SELECT 
        chave_fun,
        TO_CHAR(periodo, 'YYYY-MM-DD') as periodo,
        dsc_evento,
        total,
        ponto_evento,
        total_pontos_evento,
        digitos
      FROM vw_eventos
      WHERE digitos = $1
      ORDER BY periodo DESC
    `;

    const result = await pool.query(query, [digitos]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Nenhum evento encontrado para estes dígitos' 
      });
    }

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Erro na consulta de eventos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;
