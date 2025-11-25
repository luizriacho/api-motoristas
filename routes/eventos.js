import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/eventos?digitos=12345678  (AGORA COM 8 DÍGITOS)
router.get("/eventos", async (req, res) => {
  try {
    const { digitos } = req.query;

    // Validação do parâmetro obrigatório
    if (!digitos) {
      return res.status(400).json({
        error: 'Parâmetro "digitos" é obrigatório'
      });
    }

    // Validação: deve ter exatamente 8 dígitos numéricos (AGORA 8)
    if (digitos.length !== 8 || isNaN(digitos)) {
      return res.status(400).json({
        error: 'digitos deve conter exatamente 8 dígitos numéricos'
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
        digitos  -- CAMPO ATUALIZADO
      FROM vw_eventos
      WHERE digitos = $1  -- CAMPO ATUALIZADO
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