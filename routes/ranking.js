import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/mestre/:empresa/:periodo", async (req, res) => {
    const { empresa, periodo } = req.params;

    try {
        const result = await pool.query(
            `SELECT chave_fun, matricula, nome, periodo, dias_trabalhados, total_pontos, media_pontos, desempenho, total_ocorrencia, total_reclamacao, total_elogio, saldo_ro, qtde_desempenho_excelente, ranking, nome_garagem, digitos, empresa
       FROM mestre
       WHERE empresa = $1
         AND periodo = $2
       ORDER BY matricula`,
            [empresa, periodo]
        );

        res.json(result.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ erro: "Erro na API" });
    }
});

export default router;
