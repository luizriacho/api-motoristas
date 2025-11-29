import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/**
 * POST - inserir ou atualizar config_colunas
 */
router.post("/config-colunas", async (req, res) => {
  const { empresa, tela, coluna, visivel, largura, ordem } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO config_colunas (
          empresa, tela, coluna, visivel, largura, ordem, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (empresa, tela, coluna)
       DO UPDATE SET
          visivel = EXCLUDED.visivel,
          largura = EXCLUDED.largura,
          ordem = EXCLUDED.ordem,
          updated_at = NOW()
       RETURNING *`,
      [empresa, tela, coluna, visivel, largura, ordem]
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao salvar configuração" });
  }
});

/**
 * GET - buscar todas colunas de uma tela
 */
router.get("/config-colunas/:empresa/:tela", async (req, res) => {
  const { empresa, tela } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
         FROM config_colunas
        WHERE empresa = $1 AND tela = $2
        ORDER BY ordem ASC, coluna ASC`,
      [empresa, tela]
    );

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao buscar colunas" });
  }
});

/**
 * GET - buscar 1 coluna específica
 */
router.get("/config-colunas/:empresa/:tela/:coluna", async (req, res) => {
  const { empresa, tela, coluna } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
         FROM config_colunas
        WHERE empresa = $1 AND tela = $2 AND coluna = $3`,
      [empresa, tela, coluna]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ erro: "Configuração não encontrada" });

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao buscar coluna" });
  }
});

export default router;
