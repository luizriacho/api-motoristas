// MESTRE - por empresa e período
router.get("/mestre/:empresa/:periodo", async (req, res) => {
  const { empresa, periodo } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
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
