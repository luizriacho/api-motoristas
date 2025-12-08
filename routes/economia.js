// routes/economia.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();  

// Função auxiliar para determinar o tipo de unidade
const determinarTipoUnidade = (unidade) => {
  if (unidade === 'GERAL') return 'Total Empresa';
  if (unidade === 'MATRIZ') return 'Unidade Principal';
  return 'Unidade Operacional';
};

// GET: Buscar dados de economia por empresa (rota original, se necessário)
router.get("/empresa/:empresa", async (req, res) => {
  const { empresa } = req.params;
  try {
    // Exemplo de consulta - ajuste conforme necessário
    const result = await pool.query(
      `SELECT * FROM economia_combustivel WHERE empresa = $1`,
      [empresa]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro na API" });
  }
});

// GET: Buscar análise adaptativa para qualquer empresa
router.get("/analise-adaptativa/:empresa", async (req, res) => {
  const { empresa } = req.params;
  const { periodo } = req.query;

  try {
    // Primeiro, verificar quais unidades existem para esta empresa
    const unidadesQuery = await pool.query(
      `SELECT DISTINCT unidade 
       FROM economia_combustivel 
       WHERE empresa = $1`,
      [empresa]
    );

    const unidadesExistentes = unidadesQuery.rows.map(r => r.unidade);
    
    // Determinar se a empresa tem MATRIZ
    const temMatriz = unidadesExistentes.includes('MATRIZ');
    const temGeral = unidadesExistentes.includes('GERAL');

    // Buscar dados filtrados
    let query = `
      SELECT 
        unidade,
        empresa,
        periodo,
        base,
        km,
        qtde,
        media,
        percentual,
        valor_litro,
        qtde_economia,
        valor_economia,
        TO_CHAR(periodo, 'YYYY-MM') as periodo_formatado,
        TO_CHAR(periodo, 'MM/YYYY') as periodo_exibicao,
        EXTRACT(YEAR FROM periodo) as ano,
        EXTRACT(MONTH FROM periodo) as mes
      FROM vw_economia_dashboard
      WHERE empresa = $1
    `;
    
    const params = [empresa];
    let paramCount = 1;

    if (periodo && periodo !== 'TODOS') {
      paramCount++;
      query += ` AND TO_CHAR(periodo, 'YYYY-MM') = $${paramCount}`;
      params.push(periodo);
    }

    query += ` ORDER BY periodo DESC, 
               CASE unidade 
                 ${temGeral ? "WHEN 'GERAL' THEN 1" : ""}
                 ${temMatriz ? "WHEN 'MATRIZ' THEN 2" : ""}
                 ELSE 3
               END, 
               unidade`;

    const result = await pool.query(query, params);

    // Calcular métricas adaptativas
    let dadosGerais = [];
    let dadosMatriz = [];
    let dadosUnidadesOperacionais = [];

    if (temGeral) {
      dadosGerais = result.rows.filter(r => r.unidade === 'GERAL');
    } else {
      // Se não tem GERAL, usar a soma de todas as unidades como "total"
      const totalKm = result.rows.reduce((sum, r) => sum + parseFloat(r.km), 0);
      const totalValorEconomia = result.rows.reduce((sum, r) => sum + parseFloat(r.valor_economia), 0);
      const totalQtdeEconomia = result.rows.reduce((sum, r) => sum + parseFloat(r.qtde_economia), 0);
      
      dadosGerais = [{
        unidade: 'TOTAL CALCULADO',
        empresa: empresa,
        km: totalKm,
        valor_economia: totalValorEconomia,
        qtde_economia: totalQtdeEconomia,
        isCalculado: true
      }];
    }

    if (temMatriz) {
      dadosMatriz = result.rows.filter(r => r.unidade === 'MATRIZ');
    }

    // Unidades operacionais (excluindo GERAL e MATRIZ se existirem)
    dadosUnidadesOperacionais = result.rows.filter(r => 
      r.unidade !== 'GERAL' && r.unidade !== 'MATRIZ'
    );

    // Calcular contribuição da MATRIZ se existir
    let contribuicaoMatriz = null;
    if (temMatriz && temGeral && dadosGerais.length > 0 && dadosMatriz.length > 0) {
      const totalGeral = dadosGerais.reduce((sum, r) => sum + parseFloat(r.valor_economia), 0);
      const totalMatriz = dadosMatriz.reduce((sum, r) => sum + parseFloat(r.valor_economia), 0);
      
      if (totalGeral > 0) {
        contribuicaoMatriz = (totalMatriz / totalGeral) * 100;
      }
    }

    // Ranking adaptativo (excluindo GERAL se existir)
    const rankingUnidades = [...dadosUnidadesOperacionais];
    if (temMatriz) {
      rankingUnidades.push(...dadosMatriz);
    }

    // Agrupar por unidade para ranking
    const rankingAgrupado = {};
    rankingUnidades.forEach(row => {
      if (!rankingAgrupado[row.unidade]) {
        rankingAgrupado[row.unidade] = {
          unidade: row.unidade,
          tipo: determinarTipoUnidade(row.unidade),
          total_valor_economia: 0,
          total_km: 0,
          registros: 0
        };
      }
      rankingAgrupado[row.unidade].total_valor_economia += parseFloat(row.valor_economia);
      rankingAgrupado[row.unidade].total_km += parseFloat(row.km);
      rankingAgrupado[row.unidade].registros += 1;
    });

    const ranking = Object.values(rankingAgrupado)
      .sort((a, b) => b.total_valor_economia - a.total_valor_economia);

    res.json({
      success: true,
      data: result.rows,
      estruturaEmpresa: {
        temGeral,
        temMatriz,
        totalUnidades: unidadesExistentes.length,
        unidades: unidadesExistentes.sort()
      },
      dadosAgrupados: {
        geral: dadosGerais,
        matriz: dadosMatriz,
        unidadesOperacionais: dadosUnidadesOperacionais
      },
      metricas: {
        contribuicaoMatriz,
        ranking: ranking,
        totalUnidadesRanking: ranking.length
      },
      empresa: empresa
    });
  } catch (e) {
    console.error("Erro na análise adaptativa:", e);
    res.status(500).json({ 
      success: false,
      erro: "Erro na análise adaptativa" 
    });
  }
});

// GET: Buscar unidades por tipo (genérico)
router.get("/unidades-por-tipo/:empresa", async (req, res) => {
  const { empresa } = req.params;

  try {
    // Primeiro, identificar as unidades existentes
    const unidadesQuery = await pool.query(
      `SELECT DISTINCT unidade 
       FROM economia_combustivel 
       WHERE empresa = $1`,
      [empresa]
    );

    const unidades = unidadesQuery.rows.map(r => r.unidade);
    
    // Classificar unidades
    const unidadesClassificadas = unidades.map(unidade => {
      let tipo = 'operacional';
      let ordem = 3;
      
      if (unidade === 'GERAL') {
        tipo = 'total';
        ordem = 1;
      } else if (unidade === 'MATRIZ') {
        tipo = 'principal';
        ordem = 2;
      }
      
      return { unidade, tipo, ordem };
    }).sort((a, b) => a.ordem - b.ordem);

    // Se não houver MATRIZ, identificar qual unidade poderia ser considerada principal
    // (por exemplo, a que tem maior valor de economia)
    let unidadePrincipal = null;
    if (!unidades.includes('MATRIZ')) {
      const economiaPorUnidade = await pool.query(
        `SELECT 
          unidade,
          SUM(valor_economia) as total_economia
         FROM economia_combustivel
         WHERE empresa = $1
           AND unidade != 'GERAL'
         GROUP BY unidade
         ORDER BY total_economia DESC
         LIMIT 1`,
        [empresa]
      );
      
      if (economiaPorUnidade.rows.length > 0) {
        unidadePrincipal = {
          unidade: economiaPorUnidade.rows[0].unidade,
          total_economia: economiaPorUnidade.rows[0].total_economia,
          sugestao: 'Esta unidade tem a maior economia e pode ser considerada a principal'
        };
      }
    }

    res.json({
      success: true,
      unidades: unidadesClassificadas,
      totalUnidades: unidades.length,
      unidadePrincipalSugerida: unidadePrincipal,
      empresa: empresa
    });
  } catch (e) {
    console.error("Erro ao buscar unidades por tipo:", e);
    res.status(500).json({ 
      success: false,
      erro: "Erro ao buscar unidades por tipo" 
    });
  }
});

export default router;