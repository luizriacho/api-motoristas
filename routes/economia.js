// routes/economia.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();  

router.get("/analise-adaptativa/:empresa", async (req, res) => {
  const { empresa } = req.params;
  const { periodo } = req.query;

  try {
    let query = `
      SELECT 
        unidade
        , empresa
        , periodo
        , base
        , km
        , qtde
        , media
        , percentual
        , valor_litro
        , qtde_economia
        , valor_economia
        , TO_CHAR(periodo, 'YYYY-MM') as periodo_formatado
        , TO_CHAR(periodo, 'MM/YYYY') as periodo_exibicao
      FROM vw_economia_dashboard
      WHERE empresa = $1
    `;
    
    const params = [empresa];
    if (periodo && periodo !== 'TODOS') {
      query += ` AND TO_CHAR(periodo, 'YYYY-MM') = $2`;
      params.push(periodo);
    }

    query += ` ORDER BY periodo DESC, unidade ASC`;

    const result = await pool.query(query, params);
    const rows = result.rows;

    // 1. ISOLAR O RESUMO (Apenas a unidade GERAL contém o total real sem duplicar)
    const dadosGerais = rows.filter(r => r.unidade === 'GERAL');
    
    // 2. ISOLAR RANKING (Excluir GERAL para não poluir o gráfico de comparação)
    const dadosParaRanking = rows.filter(r => r.unidade !== 'GERAL');

    // 3. CÁLCULO DO RESUMO (Baseado na unidade GERAL)
    const resumoFinal = {
        total_valor_economia: 0
        , total_km: 0
        , total_litros: 0
        , media_km_l: 0
        , percentual_medio: 0
    };

    if (dadosGerais.length > 0) {
      const kmTotal = dadosGerais.reduce((sum, r) => sum + Number(r.km), 0);
      const qtdeTotal = dadosGerais.reduce((sum, r) => sum + Number(r.qtde), 0);
      
      resumoFinal.total_valor_economia = dadosGerais.reduce((sum, r) => sum + Number(r.valor_economia), 0);
      resumoFinal.total_km = kmTotal;
      resumoFinal.total_litros = qtdeTotal;
      // Correção da Média: KM dividido por LITROS
      resumoFinal.media_km_l = qtdeTotal > 0 ? (kmTotal / qtdeTotal) : 0;
      resumoFinal.percentual_medio = dadosGerais.reduce((sum, r) => sum + Number(r.percentual), 0) / dadosGerais.length;
    }

    res.json({
      success: true
      , data: rows
      , resumo: resumoFinal
      , ranking: dadosParaRanking
      , empresa: empresa
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, erro: "Erro na análise" });
  }
});

export default router;