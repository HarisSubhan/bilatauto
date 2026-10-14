import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID as id } from "node:crypto";
import { pool } from "./db.js";
import { requireAuth, superAdmin, loadUser } from "./auth.js";
import { log } from "./log.js";

export const publicRoutes = Router();
publicRoutes.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const [[u]] = await pool.query("SELECT * FROM users WHERE email=?", [String(email || "").toLowerCase()]);
  if (!u || !(await bcrypt.compare(String(password || ""), u.password_hash))) return res.status(401).json({ error: "Invalid email or password" });
  if (u.status !== "active") return res.status(403).json({ error: "Account is not active" });
  const token = jwt.sign({ sub: u.id }, process.env.JWT_SECRET, { expiresIn: "12h" });
  await log(pool, u, "login", "auth", u.id, u.email);
  res.json({ token, user: await loadUser(u.id) });
});

const r = Router();
r.use(requireAuth);
r.get("/auth/me", (req, res) => res.json(req.user));
r.get("/dashboard", async (req, res) => {
  const one = async (sql) => (await pool.query(sql))[0][0].n;
  res.json({
    suppliers: await one("SELECT COUNT(*) n FROM suppliers"), departments: await one("SELECT COUNT(*) n FROM departments"),
    hs_codes: await one("SELECT (SELECT COUNT(*) FROM fbr_hs_codes)+(SELECT COUNT(*) FROM custom_hs_codes) n"),
    pending_quotations: await one("SELECT COUNT(*) n FROM quotations WHERE status='submitted'"),
    invoices: await one("SELECT COUNT(*) n FROM invoices"), low_stock: await one("SELECT COUNT(*) n FROM current_stock WHERE available <= 0"),
  });
});

r.get("/settings", async (_req, res) => { const [rows] = await pool.query("SELECT `key`, value FROM system_settings"); res.json(Object.fromEntries(rows.map((x) => [x.key, x.value]))); });
r.put("/settings", superAdmin, async (req, res) => {
  for (const [k, v] of Object.entries(req.body || {})) await pool.query("INSERT INTO system_settings(`key`,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)", [k, String(v ?? "")]);
  await log(pool, req.user, "update", "system_settings", null, "settings", null, req.body);
  res.json({ ok: true });
});

r.get("/users", async (_req, res) => {
  const [rows] = await pool.query("SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at, ur.role_id, ro.name role_name FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles ro ON ro.id=ur.role_id ORDER BY u.created_at");
  res.json(rows);
});
r.post("/users", superAdmin, async (req, res) => {
  const { full_name, email, phone, password, role_id } = req.body || {};
  if (!full_name || !email || !password || password.length < 8 || !role_id) return res.status(400).json({ error: "Name, email, role and an 8+ character password are required" });
  const uid = id();
  await pool.query("INSERT INTO users SET ?", [{ id: uid, full_name, email: email.toLowerCase(), phone: phone || null, password_hash: await bcrypt.hash(password, 10) }]);
  await pool.query("INSERT INTO user_roles SET ?", [{ id: id(), user_id: uid, role_id }]);
  await log(pool, req.user, "insert", "users", uid, email);
  res.json({ id: uid });
});
r.put("/users/:id", superAdmin, async (req, res) => {
  const { status, role_id, password } = req.body || {};
  if (status) await pool.query("UPDATE users SET status=? WHERE id=?", [status, req.params.id]);
  if (password) await pool.query("UPDATE users SET password_hash=? WHERE id=?", [await bcrypt.hash(password, 10), req.params.id]);
  if (role_id) { await pool.query("DELETE FROM user_roles WHERE user_id=?", [req.params.id]); await pool.query("INSERT INTO user_roles SET ?", [{ id: id(), user_id: req.params.id, role_id }]); }
  await log(pool, req.user, "update", "users", req.params.id, null, null, { status, role_id, password_changed: !!password });
  res.json({ ok: true });
});

r.get("/roles", async (_req, res) => res.json((await pool.query("SELECT * FROM roles ORDER BY name"))[0]));
r.post("/roles", superAdmin, async (req, res) => { const rid = id(); await pool.query("INSERT INTO roles SET ?", [{ id: rid, name: req.body.name, slug: req.body.slug, description: req.body.description || null }]); res.json({ id: rid }); });
r.get("/permissions", async (_req, res) => {
  const [perms] = await pool.query("SELECT * FROM permissions ORDER BY module, action");
  const [links] = await pool.query("SELECT * FROM role_permissions");
  res.json({ perms, links });
});
r.put("/roles/:id/permissions", superAdmin, async (req, res) => {
  await pool.query("DELETE FROM role_permissions WHERE role_id=?", [req.params.id]);
  for (const pid of req.body.permission_ids || []) await pool.query("INSERT INTO role_permissions VALUES (?,?)", [req.params.id, pid]);
  await log(pool, req.user, "update", "role_permissions", req.params.id, null);
  res.json({ ok: true });
});

r.get("/activity-logs", async (req, res) => {
  const t = `%${req.query.search || ""}%`;
  const [rows] = await pool.query("SELECT id, user_name, action, module, record_label, created_at FROM activity_logs WHERE module LIKE ? OR record_label LIKE ? OR user_name LIKE ? ORDER BY created_at DESC LIMIT 500", [t, t, t]);
  res.json(rows);
});

// AI quotation reading lives in routes-ai.js (key stored in Settings, text fallback without a key).

export default r;
