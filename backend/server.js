import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import { seedTitles, seedAdmin } from "./seed.js";
import authRouter from "./routes/auth.js";
import profilesRouter from "./routes/profiles.js";
import adminRouter from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 5100;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SaiFlix backend is running (by Devarinti Saiprasad)",
    endpoints: [
      "POST /api/auth/register, /api/auth/login",
      "GET, POST /api/profiles (login)",
      "GET /api/profiles/:id/titles (login)",
      "PUT, DELETE /api/profiles/:id/list/:titleId, /likes/:titleId, /progress/:titleId (login)",
      "GET /api/admin/stats, /api/admin/users (admin only)",
    ],
  });
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/admin", adminRouter);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error. Check the backend terminal for details." });
});

try {
  await initDb();      // connect to PostgreSQL, create the database and tables
  await seedTitles();  // fill the catalogue (first run only)
  await seedAdmin();   // optional admin from .env
  app.listen(PORT, () => console.log(`SaiFlix backend running at http://localhost:${PORT}`));
} catch (err) {
  const refused = err.code === "ECONNREFUSED" || err.errors?.some((e) => e.code === "ECONNREFUSED");
  console.error("\nCould not start the backend.");
  if (err.code === "28P01") console.error("Wrong PostgreSQL password. Edit DATABASE_URL in backend/.env (the text after postgres:).");
  else if (refused) console.error("PostgreSQL is not running or not installed. Install it and keep the default port 5432.");
  else console.error(err.message);
  console.error("");
  process.exit(1);
}
