import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Only logged-in ADMINS can use anything below (members get 403 Forbidden)
router.use(requireAuth, requireRole("admin"));

// GET /api/admin/stats
router.get("/stats", async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT (SELECT COUNT(*) FROM users)::int AS users,
             (SELECT COUNT(*) FROM profiles)::int AS profiles,
             (SELECT COUNT(*) FROM titles)::int AS titles,
             (SELECT COUNT(*) FROM watch_progress)::int AS plays`);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get("/users", async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at AS "createdAt",
             (SELECT COUNT(*) FROM profiles p WHERE p.user_id = u.id)::int AS profiles
      FROM users u ORDER BY u.id`);
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/role   { role: "admin" | "member" }
router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["admin", "member"].includes(role)) return res.status(400).json({ error: "Role must be admin or member" });
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: "You cannot change your own role" });
    const { rows } = await query("UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role", [role, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: "You cannot delete your own account" });
    const { rowCount } = await query("DELETE FROM users WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/admin/titles   add a movie or series
router.post("/titles", async (req, res, next) => {
  try {
    const { title = "", year, genre = "", type = "movie", maturity = "13+", runtime = "", description = "" } = req.body;
    if (!title.trim() || !genre.trim()) return res.status(400).json({ error: "Title and genre are required" });
    if (!["movie", "series"].includes(type)) return res.status(400).json({ error: "Type must be movie or series" });
    const { rows } = await query(
      `INSERT INTO titles (title, year, genre, type, maturity, runtime, description, hue)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [title.trim(), Number(year) || null, genre.trim(), type, maturity.trim() || "13+", runtime.trim(), description.trim(), Math.floor(Math.random() * 360)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/admin/titles/:id
router.delete("/titles/:id", async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM titles WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Title not found" });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
