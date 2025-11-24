import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/eventos?sete_digitos_cpf=1234567
router.get("/eventos", async (req, res) => {
  try {
    const { sete_digitos_cpf } = req.query;

    // Validação do parâmetro obrigatório
    if (!sete_digitos_cpf) {
      return res.status(400).json({
        error: 'Parâmetro "sete_digitos_cpf" é obrigatório'
      });
    }

    // Validação: deve ter exatamente 7 dígitos numéricos
    if (sete_digitos_cpf.length !== 7 || isNaN(sete_digitos_cpf)) {
      return res.status(400).json({
        error: 'sete_digitos_cpf deve conter exatamente 7 dígitos numéricos'
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
        sete_digitos_cpf
      FROM vw_eventos
      WHERE sete_digitos_cpf = $1
      ORDER BY periodo DESC
    `;

    const result = await pool.query(query, [sete_digitos_cpf]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Nenhum evento encontrado para este CPF' 
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