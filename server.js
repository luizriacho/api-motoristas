import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import eventosRoutes from "./routes/eventos.js"; // Nova rota
import operadorRoutes from "./routes/operador.js";
import ColunasRoutes from "./routes/colunas.js";
import empresasRoutes from "./routes/empresas.js";
import adminRouter from './routes/admin.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Carrega as rotas
app.use("/api", operadorRoutes);
app.use("/api", eventosRoutes); // Nova rota adicionada
app.use("/api", ColunasRoutes);
app.use("/api", empresasRoutes);
app.use('/api', adminRouter);

// Teste
app.get("/", (req, res) => {
  res.send("✅ API está rodando na Railway!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});