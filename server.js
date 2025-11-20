import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import operadorRoutes from "./routes/operador.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rota principal para teste
app.get("/", (req, res) => {
  res.send("✅ API está rodando na Railway!");
});

// Rotas da API
app.use("/api", operadorRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});
