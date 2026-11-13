import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { SECRET, requireAuth } from "../middleware/auth.js";

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const makeToken = (user) => jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "7d" });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/register   { name, email, password }
router.post("/register", async (req, res, next) => {
  try {
    const { name = "", email = "", password = "" } = req.body;
    if (!name.trim()) return res.status(400).json({ error: "Name is required" });
    if (!EMAIL_RE.test(email.trim())) return res.status(400).json({ error: "Enter a valid email" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const cleanEmail = email.trim().toLowerCase();
    // First user (or ADMIN_EMAIL) becomes admin, everyone else is a member
    const { rows: count } = await query("SELECT COUNT(*)::int AS n FROM users");
    const isAdmin = count[0].n === 0 || cleanEmail === (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

    const { rows } = await query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name.trim(), cleanEmail, await bcrypt.hash(password, 10), isAdmin ? "admin" : "member"]
    );
    // Every account starts with one profile
    await query("INSERT INTO profiles (user_id, name, avatar) VALUES ($1, $2, $3)", [rows[0].id, name.trim().slice(0, 20), Math.floor(Math.random() * 360)]);
    res.status(201).json({ token: makeToken(rows[0]), user: publicUser(rows[0]) });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "This email is already registered" });
    next(err);
  }
});

// POST /api/auth/login   { email, password }
router.post("/login", async (req, res, next) => {
  try {
    const { email = "", password = "" } = req.body;
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email.trim().toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Wrong email or password" });
    }
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => res.json(publicUser(req.user)));

export default router;
