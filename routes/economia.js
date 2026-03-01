import express from "express";
import { pool } from "../db.js";

const router = express.Router();  

// Voltamos para a rota antiga que você confirmou que funcionava
router.get("/empresa/:empresa", async (req, res) => {
    const { empresa } = req.params
    , { periodo } = req.query;

    try {
        let query = `
            SELECT 
                unidade
                , empresa
                , periodo
                , km
                , qtde
                , media
                , percentual
                , valor_litro
                , valor_economia
                , TO_CHAR(periodo, 'YYYY-MM') as periodo_id
            FROM vw_economia_dashboard
            WHERE empresa = $1
        `;
        
        const params = [empresa.toUpperCase()];
        if (periodo && periodo !== 'TODOS') {
            query += ` AND TO_CHAR(periodo, 'YYYY-MM') = $2`;
            params.push(periodo);
        }

        query += ` ORDER BY periodo DESC, unidade ASC`;

        const result = await pool.query(query, params);
        const rows = result.rows;

        // Filtros para evitar duplicidade no dashboard
        const dadosGerais = rows.filter(r => r.unidade === 'GERAL')
        , dadosParaRanking = rows.filter(r => r.unidade !== 'GERAL')
        , periodosDisponiveis = [...new Set(rows.map(r => r.periodo_id))];

        // Cálculo do Resumo corrigindo para KM/L
        const resumoFinal = {
            total_valor_economia: 0
            , total_km: 0
            , total_litros: 0
            , media_km_l: 0
            , percentual_medio: 0
        };

        if (dadosGerais.length > 0) {
            const kmTotal = dadosGerais.reduce((sum, r) => sum + Number(r.km), 0)
            , qtdeTotal = dadosGerais.reduce((sum, r) => sum + Number(r.qtde), 0);
            
            resumoFinal.total_valor_economia = dadosGerais.reduce((sum, r) => sum + Number(r.valor_economia), 0);
            resumoFinal.total_km = kmTotal;
            resumoFinal.total_litros = qtdeTotal;
            // CORREÇÃO: KM dividido por Litros
            resumoFinal.media_km_l = qtdeTotal > 0 ? (kmTotal / qtdeTotal) : 0;
            resumoFinal.percentual_medio = dadosGerais.reduce((sum, r) => sum + Number(r.percentual), 0) / dadosGerais.length;
        }

        // Enviamos tudo num único objeto para o Hook ler
        res.json({
            success: true
            , data: rows
            , resumo: resumoFinal
            , ranking: dadosParaRanking
            , periodos: periodosDisponiveis
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, erro: "Erro no servidor" });
    }
});

export default router;