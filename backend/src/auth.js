import jwt from "jsonwebtoken";
import { pool } from "./db.js";

export async function loadUser(userId) {
  const [[u]] = await pool.query("SELECT id, full_name, email, phone, status FROM users WHERE id=?", [userId]);
  if (!u) return null;
  const [roles] = await pool.query("SELECT r.slug FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?", [userId]);
  const [perms] = await pool.query(`SELECT DISTINCT CONCAT(p.module,':',p.action) k FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id=ur.role_id JOIN permissions p ON p.id=rp.permission_id WHERE ur.user_id=?`, [userId]);
  return { ...u, roles: roles.map((r) => r.slug), permissions: perms.map((p) => p.k) };
}

export async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    const { sub } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await loadUser(sub);
    if (!user || user.status !== "active") return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: "Unauthorized" }); }
}

export const can = (module, action) => (req, res, next) =>
  req.user.roles.includes("super_admin") || req.user.permissions.includes(`${module}:${action}`)
    ? next() : res.status(403).json({ error: "You do not have permission for this action" });

export const superAdmin = (req, res, next) =>
  req.user.roles.includes("super_admin") ? next() : res.status(403).json({ error: "Super Admin only" });
