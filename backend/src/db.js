import mysql from "mysql2/promise";
import "dotenv/config";
export const pool = mysql.createPool({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 10,
  // Release idle connections so a quiet server does not hold MySQL connections open.
  maxIdle: 4, idleTimeout: 60000,
  dateStrings: true, decimalNumbers: true, multipleStatements: false,
});
export async function tx(fn) {
  const c = await pool.getConnection();
  try { await c.beginTransaction(); const r = await fn(c); await c.commit(); return r; }
  catch (e) { await c.rollback(); throw e; } finally { c.release(); }
}
export async function nextNumber(c, prefix) {
  await c.query("INSERT IGNORE INTO document_counters(prefix) VALUES (?)", [prefix]);
  await c.query("UPDATE document_counters SET last_value = last_value + 1 WHERE prefix = ?", [prefix]);
  const [[r]] = await c.query("SELECT last_value, padding FROM document_counters WHERE prefix = ?", [prefix]);
  return `${prefix}-${String(r.last_value).padStart(r.padding, "0")}`;
}
