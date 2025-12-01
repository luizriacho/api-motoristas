// empresas.js - Nova rota para empresas_admin
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/empresas/:digitos
// Buscar empresa pelo campo digitos (8 caracteres)
router.get("/empresas/:digitos", async (req, res) => {
  const { digitos } = req.params;

  try {
    // Validação: digitos deve ter exatamente 8 caracteres
    if (!digitos || digitos.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "digitos" deve conter exatamente 8 caracteres'
      });
    }

    console.log(`🔍 Buscando empresa por digitos: ${digitos}`);
    
    const query = `
      SELECT 
        codigo_empresa,
        nome_empresa,
        digitos
      FROM empresas_admin
      WHERE digitos = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [digitos]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada para os dígitos fornecidos'
      });
    }

    const empresa = result.rows[0];
    
    console.log(`✅ Empresa encontrada: ${empresa.nome_empresa} (${empresa.codigo_empresa})`);
    
    res.json({
      success: true,
      data: empresa
    });

  } catch (error) {
    console.error('❌ Erro ao buscar empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresa'
    });
  }
});

// GET /api/empresas
// Listar todas as empresas (opcional, para testes)
router.get("/empresas", async (req, res) => {
  try {
    console.log('📋 Listando todas as empresas');
    
    const query = `
      SELECT 
        codigo_empresa,
        nome_empresa,
        digitos
      FROM empresas_admin
      ORDER BY nome_empresa
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar empresas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao listar empresas'
    });
  }
});

// GET /api/empresas/codigo/:codigo
// Buscar empresa pelo código (opcional)
router.get("/empresas/codigo/:codigo", async (req, res) => {
  const { codigo } = req.params;

  try {
    // Validação: código deve ter exatamente 2 caracteres
    if (!codigo || codigo.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "codigo" deve conter exatamente 2 caracteres'
      });
    }

    console.log(`🔍 Buscando empresa por código: ${codigo}`);
    
    const query = `
      SELECT 
        codigo_empresa,
        nome_empresa,
        digitos
      FROM empresas_admin
      WHERE codigo_empresa = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada para o código fornecido'
      });
    }

    const empresa = result.rows[0];
    
    console.log(`✅ Empresa encontrada: ${empresa.nome_empresa} (${empresa.digitos})`);
    
    res.json({
      success: true,
      data: empresa
    });

  } catch (error) {
    console.error('❌ Erro ao buscar empresa por código:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresa'
    });
  }
});

export default router;