import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// LOGIN DO ADMINISTRADOR
router.post("/admin/login", async (req, res) => {
  const { digitos } = req.body;

  try {
    // Verificar se existe na tabela empresas_admin
    const queryAdmin = `
      SELECT codigo_empresa, nome_empresa, digitos
      FROM empresas_admin
      WHERE digitos = $1
    `;

    const result = await pool.query(queryAdmin, [digitos]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Administrador não encontrado" 
      });
    }

    const admin = result.rows[0];
    
    console.log(`✅ Administrador autenticado: ${admin.nome_empresa} (${admin.codigo_empresa})`);
    
    res.json({
      success: true,
      data: {
        ...admin,
        perfil: 'admin',
        isAdmin: true
      }
    });

  } catch (error) {
    console.error('❌ Erro no login do administrador:', error);
    res.status(500).json({ 
      success: false,
      error: "Erro interno do servidor" 
    });
  }
});

// MOVIMENTOS DO ADMINISTRADOR (todos os operadores da empresa)
router.get("/admin/movimentos/:digitosAdmin", async (req, res) => {
  const { digitosAdmin } = req.params;

  try {
    // Validar parâmetro
    if (!digitosAdmin || digitosAdmin.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "digitosAdmin" deve conter exatamente 8 caracteres'
      });
    }

    console.log(`🔍 Buscando movimentos para admin: ${digitosAdmin}`);
    
    const query = `
      SELECT *
      FROM vw_movimentos_admin
      WHERE administrador = $1
      ORDER BY data_movimento DESC
    `;

    const result = await pool.query(query, [digitosAdmin]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum movimento encontrado para este administrador'
      });
    }

    console.log(`✅ Movimentos encontrados: ${result.rows.length}`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar movimentos do admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// MOVIMENTOS DO ADMINISTRADOR POR OPERADOR ESPECÍFICO
router.get("/admin/movimentos/:digitosAdmin/operador/:digitosOperador", async (req, res) => {
  const { digitosAdmin, digitosOperador } = req.params;

  try {
    // Validar parâmetros
    if (!digitosAdmin || digitosAdmin.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "digitosAdmin" deve conter exatamente 8 caracteres'
      });
    }

    if (!digitosOperador || digitosOperador.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "digitosOperador" deve conter exatamente 8 caracteres'
      });
    }

    console.log(`🔍 Buscando movimentos do operador ${digitosOperador} para admin: ${digitosAdmin}`);
    
    const query = `
      SELECT *
      FROM vw_movimentos_admin
      WHERE administrador = $1 
        AND digitos = $2
      ORDER BY data_movimento DESC
    `;

    const result = await pool.query(query, [digitosAdmin, digitosOperador]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum movimento encontrado para este operador'
      });
    }

    console.log(`✅ Movimentos encontrados: ${result.rows.length}`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar movimentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// EVENTOS DO ADMINISTRADOR
router.get("/admin/eventos/:digitosAdmin", async (req, res) => {
  const { digitosAdmin } = req.params;
  const { periodo } = req.query;

  try {
    // Validar parâmetro
    if (!digitosAdmin || digitosAdmin.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "digitosAdmin" deve conter exatamente 8 caracteres'
      });
    }

    let query;
    let params;

    if (periodo) {
      // Validar formato do período (YYYY-MM)
      const periodoRegex = /^\d{4}-\d{2}$/;
      if (!periodoRegex.test(periodo)) {
        return res.status(400).json({
          success: false,
          error: 'Período deve estar no formato YYYY-MM'
        });
      }

      console.log(`🔍 Buscando eventos para admin: ${digitosAdmin}, período: ${periodo}`);
      
      query = `
        SELECT *
        FROM vw_eventos_administrador
        WHERE administrador = $1 
          AND TO_CHAR(periodo, 'YYYY-MM') = $2
        ORDER BY periodo DESC
      `;
      params = [digitosAdmin, periodo];
    } else {
      console.log(`🔍 Buscando todos os eventos para admin: ${digitosAdmin}`);
      
      query = `
        SELECT *
        FROM vw_eventos_administrador
        WHERE administrador = $1
        ORDER BY periodo DESC
      `;
      params = [digitosAdmin];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: periodo ? 
          `Nenhum evento encontrado para o período ${periodo}` :
          'Nenhum evento encontrado'
      });
    }

    console.log(`✅ Eventos encontrados: ${result.rows.length}`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar eventos do admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// LISTAR OPERADORES DISPONÍVEIS PARA O ADMINISTRADOR
router.get("/admin/operadores/:digitosAdmin", async (req, res) => {
  const { digitosAdmin } = req.params;

  try {
    // Validar parâmetro
    if (!digitosAdmin || digitosAdmin.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "digitosAdmin" deve conter exatamente 8 caracteres'
      });
    }

    console.log(`🔍 Listando operadores para admin: ${digitosAdmin}`);
    
    const query = `
      SELECT DISTINCT 
        chave_fun,
        matricula,
        nome,
        digitos,
        media_pontos,
        desempenho,
        ranking,
        empresa
      FROM vw_movimentos_admin
      WHERE administrador = $1
      ORDER BY nome
    `;

    const result = await pool.query(query, [digitosAdmin]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum operador encontrado'
      });
    }

    console.log(`✅ Operadores encontrados: ${result.rows.length}`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar operadores:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;