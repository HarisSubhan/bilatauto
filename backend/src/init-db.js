import fs from "node:fs";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomUUID as id } from "node:crypto";
import "dotenv/config";

const c = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const sql = fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8").replace(/^--.*$/gm, "");
for (const stmt of sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) await c.query(stmt);

const roles = [["Super Admin", "super_admin"], ["Admin", "admin"], ["Manager", "manager"], ["Sales", "sales"], ["Store Keeper", "store_keeper"], ["Viewer", "viewer"]];
for (const [name, slug] of roles) await c.query("INSERT IGNORE INTO roles(id,name,slug,is_system) VALUES (?,?,?,1)", [id(), name, slug]);
const modules = ["dashboard", "suppliers", "departments", "fbr_hs_codes", "custom_hs_codes", "purchases", "quotations", "invoices", "stock", "reports", "users", "settings", "activity_logs"];
for (const m of modules) for (const a of ["view", "create", "edit", "delete", "verify", "approve", "export"])
  await c.query("INSERT IGNORE INTO permissions(id,module,action) VALUES (?,?,?)", [id(), m, a]);
const settings = { company_name: "Bilal Autos", system_name: "Spare Parts Management System", currency: "PKR", invoice_footer: "Thank you for your business.", company_address: "", company_phone: "", company_email: "" };
for (const [k, v] of Object.entries(settings)) await c.query("INSERT IGNORE INTO system_settings(`key`,value) VALUES (?,?)", [k, v]);

const email = process.env.ADMIN_EMAIL;
const [[existing]] = await c.query("SELECT id FROM users WHERE email=?", [email]);
if (!existing) {
  const uid = id();
  await c.query("INSERT INTO users(id,full_name,username,email,password_hash) VALUES (?,?,?,?,?)", [uid, process.env.ADMIN_NAME || "Super Admin", "admin", email, await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)]);
  const [[r]] = await c.query("SELECT id FROM roles WHERE slug='super_admin'");
  await c.query("INSERT INTO user_roles(id,user_id,role_id) VALUES (?,?,?)", [id(), uid, r.id]);
  console.log("Super Admin created:", email);
}
console.log("Database ready");
await c.end();
