import "dotenv/config";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT) || 3333;

app.listen(port, () => {
  console.log(`BloodLink backend rodando em http://localhost:${port}`);
});
