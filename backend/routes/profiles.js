import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Every route with :pid checks that the profile belongs to the logged-in user
router.param("pid", async (req, res, next, pid) => {
  try {
    if (!/^\d+$/.test(pid)) return res.status(404).json({ error: "Profile not found" });
    const { rows } = await query("SELECT * FROM profiles WHERE id = $1 AND user_id = $2", [pid, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "Profile not found" });
    req.profile = rows[0];
    next();
  } catch (err) { next(err); }
});

const tidOk = (req, res) => {
  if (!/^\d+$/.test(req.params.tid)) { res.status(404).json({ error: "Title not found" }); return false; }
  return true;
};
// Run a query that points at a title; a missing title shows up as a foreign-key error
async function withTitle(res, next, sql, params) {
  try {
    await query(sql, params);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "23503") return res.status(404).json({ error: "Title not found" });
    next(err);
  }
}

// GET /api/profiles
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT id, name, avatar FROM profiles WHERE user_id = $1 ORDER BY id", [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/profiles   { name }   (max 4 per account)
router.post("/", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim().slice(0, 20);
    if (!name) return res.status(400).json({ error: "Profile name is required" });
    const { rows: c } = await query("SELECT COUNT(*)::int AS n FROM profiles WHERE user_id = $1", [req.user.id]);
    if (c[0].n >= 4) return res.status(400).json({ error: "You can have up to 4 profiles" });
    const { rows } = await query(
      "INSERT INTO profiles (user_id, name, avatar) VALUES ($1, $2, $3) RETURNING id, name, avatar",
      [req.user.id, name, Math.floor(Math.random() * 360)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/profiles/:pid   { name }
router.patch("/:pid", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim().slice(0, 20);
    if (!name) return res.status(400).json({ error: "Profile name is required" });
    const { rows } = await query("UPDATE profiles SET name = $1 WHERE id = $2 RETURNING id, name, avatar", [name, req.profile.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/profiles/:pid   (the last profile cannot be deleted)
router.delete("/:pid", async (req, res, next) => {
  try {
    const { rows: c } = await query("SELECT COUNT(*)::int AS n FROM profiles WHERE user_id = $1", [req.user.id]);
    if (c[0].n <= 1) return res.status(400).json({ error: "You need at least one profile" });
    await query("DELETE FROM profiles WHERE id = $1", [req.profile.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /api/profiles/:pid/titles   -> the whole catalogue with this profile's list, likes and progress
router.get("/:pid/titles", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT t.id, t.title, t.year, t.genre, t.type, t.maturity, t.runtime, t.description, t.hue, t.featured,
              (SELECT COUNT(*) FROM likes l WHERE l.title_id = t.id)::int AS likes,
              EXISTS (SELECT 1 FROM my_list m WHERE m.title_id = t.id AND m.profile_id = $1) AS "inList",
              EXISTS (SELECT 1 FROM likes l WHERE l.title_id = t.id AND l.profile_id = $1) AS liked,
              p.seconds, p.duration_seconds AS "durationSeconds", p.updated_at AS "watchedAt"
       FROM titles t
       LEFT JOIN watch_progress p ON p.title_id = t.id AND p.profile_id = $1
       ORDER BY t.id`,
      [req.profile.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// My List
router.put("/:pid/list/:tid", (req, res, next) => tidOk(req, res) &&
  withTitle(res, next, "INSERT INTO my_list (profile_id, title_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [req.profile.id, req.params.tid]));
router.delete("/:pid/list/:tid", (req, res, next) => tidOk(req, res) &&
  withTitle(res, next, "DELETE FROM my_list WHERE profile_id = $1 AND title_id = $2", [req.profile.id, req.params.tid]));

// Likes
router.put("/:pid/likes/:tid", (req, res, next) => tidOk(req, res) &&
  withTitle(res, next, "INSERT INTO likes (profile_id, title_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [req.profile.id, req.params.tid]));
router.delete("/:pid/likes/:tid", (req, res, next) => tidOk(req, res) &&
  withTitle(res, next, "DELETE FROM likes WHERE profile_id = $1 AND title_id = $2", [req.profile.id, req.params.tid]));

// Watch progress   { seconds, duration }
router.put("/:pid/progress/:tid", (req, res, next) => {
  if (!tidOk(req, res)) return;
  const seconds = Math.max(0, Math.floor(Number(req.body.seconds) || 0));
  const duration = Math.max(0, Math.floor(Number(req.body.duration) || 0));
  withTitle(res, next,
    `INSERT INTO watch_progress (profile_id, title_id, seconds, duration_seconds, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (profile_id, title_id)
     DO UPDATE SET seconds = $3, duration_seconds = $4, updated_at = now()`,
    [req.profile.id, req.params.tid, seconds, duration]);
});
router.delete("/:pid/progress/:tid", (req, res, next) => tidOk(req, res) &&
  withTitle(res, next, "DELETE FROM watch_progress WHERE profile_id = $1 AND title_id = $2", [req.profile.id, req.params.tid]));

export default router;
