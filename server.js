import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import operadorRoutes from "./routes/operador.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Carrega as rotas
app.use("/api", operadorRoutes);

// Teste
app.get("/", (req, res) => {
  res.send("API está rodando!");
});

console.log("PORT =", process.env.PORT);

app.listen(process.env.PORT, () => {
  console.log(`API rodando na porta ${process.env.PORT}`);
});
