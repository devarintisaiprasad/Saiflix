import bcrypt from "bcryptjs";
import { query } from "./db.js";
import { TITLES } from "./seedData.js";

// Fill the catalogue the first time the server starts
export async function seedTitles() {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM titles");
  if (rows[0].n > 0) return;
  for (let i = 0; i < TITLES.length; i++) {
    const [title, year, genre, type, maturity, runtime, description] = TITLES[i];
    await query(
      `INSERT INTO titles (title, year, genre, type, maturity, runtime, description, hue, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [title, year, genre, type, maturity, runtime, description, (i * 47) % 360, i === 0]
    );
  }
  console.log(`Catalogue ready: ${TITLES.length} titles added.`);
}

// Optional admin account, read from backend/.env (nothing is hard-coded in the source code)
export async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("No SEED_ADMIN_* set in .env. The first person who signs up becomes admin.");
    return;
  }
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ('Administrator', $1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [email, await bcrypt.hash(password, 10)]
  );
  if (rows[0]) {
    await query("INSERT INTO profiles (user_id, name, avatar) VALUES ($1, 'Administrator', 350)", [rows[0].id]);
    console.log(`Seed admin created (${email}).`);
  }
}
