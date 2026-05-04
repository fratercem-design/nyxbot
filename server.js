import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// static folder (won’t crash if missing)
app.use(express.static(path.join(__dirname, "public")));

// health check route (important for deploy platforms)
app.get("/", (req, res) => {
  res.status(200).send("Psyche AI is running.");
});

// optional: catch-all to prevent crashes on unknown routes
app.use((req, res) => {
  res.status(404).send("Route not found");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Running on port ${PORT}`);
});